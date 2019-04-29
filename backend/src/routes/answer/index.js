import { Router } from 'express';
import getAnswers from './answers.get';
import submitAnswer from './answers.post';
import verifyToken from '../middlewares/verify-token';
import { validateAnswer } from '../validation';

export default app => {
  const router = Router();

  router.get('/answers', verifyToken(app), getAnswers(app));
  router.post(
    '/answers/:pollTemplateId/:pollId',
    verifyToken(app),
    validateAnswer(app),
    submitAnswer(app)
  );

  return router;
};
