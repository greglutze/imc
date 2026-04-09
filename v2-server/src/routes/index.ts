import { Router } from 'express';
import authRoutes from './auth';
import archiveRoutes from './archive';
import artistRoutes from './artists';

const router = Router();

router.use('/auth', authRoutes);
router.use('/artists', artistRoutes);
router.use('/archive', archiveRoutes);

// Future route mounts:
// router.use('/projects', projectRoutes);
// router.use('/lyrics', lyricRoutes);
// router.use('/ingredients', ingredientRoutes);
// router.use('/reflections', reflectionRoutes);
// router.use('/channels', channelRoutes);

export default router;
