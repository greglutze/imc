import { Router } from 'express';
import authRoutes from './auth';
import projectsRoutes from './projects';
import instrument1Routes from './instrument1';
import instrument2Routes from './instrument2';
import instrument3Routes from './instrument3';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectsRoutes);
router.use('/instrument1', instrument1Routes);
router.use('/instrument2', instrument2Routes);
router.use('/instrument3', instrument3Routes);

export default router;
