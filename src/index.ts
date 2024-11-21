import './pre-start' // Must be the first import
import logger from 'jet-logger'
import cors from 'cors'  // 导入 CORS

import EnvVars from '@src/constants/EnvVars'
import server from './server'
import connectDB from './mongodb'

// // **** 配置 CORS **** //
 server.use(cors());  // 允许特定域名访问

// **** Run **** //

const SERVER_START_MSG =
  'Express server started on port: ' + EnvVars.Port.toString()
connectDB()

server.listen(EnvVars.Port, () => logger.info(SERVER_START_MSG))
