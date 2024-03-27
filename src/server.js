import express from 'express';
import cors from 'cors';
import { corsOptions } from '~/config/cors';
import { connectBb, getBd, closeDb } from '~/config/mongodb';
import exitHook from 'async-exit-hook';
import { env } from '~/config/environment';
import { APIs_V1 } from '~/routes/v1/';
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware';


const startServer = () => {
  const app = express();
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use('/v1', APIs_V1);

  app.use(errorHandlingMiddleware);


  if (env.BUILD_MODE === 'production') {
    app.listen(process.env.PORT, () => {
      console.log(`Hello ${env.AUTHOR}, I am running at ${ env.PORT }/`);
    });
  } else {
    app.listen(env.APP_PORT, env.LOCAL_APP_HOST, () => {
      console.log(`Hello ${env.AUTHOR}, I am running at ${ env.LOCAL_APP_HOST }:${ env.APP_PORT }/`);
    });
  }


  exitHook(() => {
    closeDb();
  });
};

(async () => {
  try {
    await connectBb();
    startServer();
  } catch (error) {
    process.exit(0);
  }
})();

// connectBb()
//   .then(() => console.log('đã kết nối DB '))
//   .then(() => startServer())
//   .catch(error => {
//     console.log('Error: ' + error);
//     process.exit(0);
//   });
