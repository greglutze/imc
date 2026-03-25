'use client';

import { Button, Card, CardHeader, CardTitle, CardDescription, Badge, Signal, ConfidenceMeter, Divider } from '../components/ui';

export default function Home() {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-heading-lg font-bold tracking-tight text-black">Dashboard</h1>
        <p className="text-body text-neutral-500 mt-1">Welcome back, Greg.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active Projects" value="1" signal="green" />
        <StatCard label="Reports Generated" value="0" signal="neutral" />
        <StatCard label="Prompts Created" value="0" signal="neutral" />
      </div>

      <Divider />

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading-sm font-bold text-black">Projects</h2>
          <Button size="sm">New Project</Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card hoverable>
            <CardHeader>
              <CardTitle>MMe.</CardTitle>
              <Badge variant="green">Active</Badge>
            </CardHeader>
            <CardDescription>
              Symphonic × electronic. Ólafur Arnalds meets The Prodigy.
            </CardDescription>
            <div className="mt-4 space-y-2">
              <ConfidenceMeter value={87} label="Research Score" size="sm" />
            </div>
            <div className="mt-3 flex items-center gap-4">
              <Signal color="green" shape="bar" label="Research" />
              <Signal color="yellow" shape="bar" label="Prompting" />
            </div>
          </Card>

          <Card className="border-dashed flex items-center justify-center min-h-[180px]">
            <div className="text-center">
              <p className="text-body-sm text-neutral-400 mb-3">Start a new project</p>
              <Button variant="secondary" size="sm">Create</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, signal }: { label: string; value: string; signal: 'green' | 'yellow' | 'red' | 'neutral' }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-md p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-label font-bold uppercase tracking-widest text-neutral-400">{label}</span>
        <Signal color={signal} />
      </div>
      <p className="text-heading-lg font-bold text-black">{value}</p>
    </div>
  );
}
