import { env, logger } from '@config/index';
import { errorHandler } from '@middlewares/error-handler';
import { notFoundHandler } from '@middlewares/not-found';
import { registerRoutes } from '@routes/index';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';


const app = express();

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false
});

app.disable('x-powered-by');
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) ?? true,
    credentials: true
  })
);
app.use(limiter);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

registerRoutes(app);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };

