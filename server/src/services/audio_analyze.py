#!/usr/bin/env python3
"""Extract audio features using Essentia. Called from Node via child_process."""
import sys
import json

def analyze(filepath):
    try:
        import essentia.standard as es

        audio = es.MonoLoader(filename=filepath, sampleRate=44100)()

        # Rhythm
        rhythm_extractor = es.RhythmExtractor2013(method="multifeature")
        bpm, beats, beats_confidence, _, beats_intervals = rhythm_extractor(audio)

        # Key
        key_extractor = es.KeyExtractor()
        key, scale, key_strength = key_extractor(audio)

        # Loudness
        loudness = es.Loudness()(audio)

        # Dynamic complexity
        dynamic_complexity, loudness_band = es.DynamicComplexity()(audio)

        # Energy
        energy = es.Energy()(audio)
        rms = es.RMS()(audio)

        # Spectral
        spectrum = es.Spectrum()(audio)
        spectral_centroid = es.Centroid(range=22050)(spectrum)

        # Onset rate
        onset_rate = es.OnsetRate()(audio)[1]

        # Danceability
        danceability, _ = es.Danceability()(audio)

        # LUFS approximation (using integrated loudness)
        loudness_ebu = es.LoudnessEBUR128()(audio)
        lufs = loudness_ebu[0]  # integrated loudness

        result = {
            "bpm": round(float(bpm), 1),
            "key": f"{key} {scale}",
            "energy": round(float(rms), 4),
            "danceability": round(float(danceability), 4),
            "loudness_lufs": round(float(lufs), 2),
            "dynamic_range": round(float(dynamic_complexity), 2),
            "spectral_centroid": round(float(spectral_centroid), 2),
            "onset_rate": round(float(onset_rate), 2)
        }

        print(json.dumps(result))
    except ImportError:
        # Essentia not installed — return mock data for development
        print(json.dumps({
            "bpm": 120.0,
            "key": "C minor",
            "energy": 0.15,
            "danceability": 0.65,
            "loudness_lufs": -14.0,
            "dynamic_range": 8.5,
            "spectral_centroid": 0.25,
            "onset_rate": 3.2,
            "_mock": True
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: audio_analyze.py <filepath>", file=sys.stderr)
        sys.exit(1)
    analyze(sys.argv[1])
