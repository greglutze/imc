import { Router } from 'express';
import authRoutes from './auth';
import projectsRoutes from './projects';
import instrument1Routes from './instrument1';
import instrument2Routes from './instrument2';
import instrument3Routes from './instrument3';
import checklistRoutes from './checklist';
import moodboardRoutes from './moodboard';
import lyricAdvisorRoutes from './lyricAdvisor';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectsRoutes);
router.use('/instrument1', instrument1Routes);
router.use('/instrument2', instrument2Routes);
router.use('/instrument3', instrument3Routes);
router.use('/checklist', checklistRoutes);
router.use('/moodboard', moodboardRoutes);
router.use('/lyric-advisor', lyricAdvisorRoutes);

export default router;
