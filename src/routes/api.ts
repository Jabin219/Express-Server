import { Router } from 'express'
import jetValidator from 'jet-validator'

import Paths from '../constants/Paths'
import User from '@src/models/User'
import UserRoutes from './UserRoutes'
import PartRoutes from './PartRoutes'

// **** Variables **** //

const apiRouter = Router(),
  validate = jetValidator()

// ** Add UserRouter ** //

const userRouter = Router()

// Get all users
userRouter.get(Paths.Users.Get, UserRoutes.getAll)

// Add one user
userRouter.post(
  Paths.Users.Add,
  validate(['user', User.isUser]),
  UserRoutes.add
)

// Update one user
userRouter.put(
  Paths.Users.Update,
  validate(['user', User.isUser]),
  UserRoutes.update
)

// Delete one user
userRouter.delete(
  Paths.Users.Delete,
  validate(['id', 'number', 'params']),
  UserRoutes.delete
)

// Add UserRouter
apiRouter.use(Paths.Users.Base, userRouter)

// Add Parts
const partRouter = Router()
partRouter.post(Paths.Parts.Add, PartRoutes.addParts)
apiRouter.use(Paths.Parts.Base, partRouter)

// **** Export default **** //

export default apiRouter
