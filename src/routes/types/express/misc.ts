import * as e from 'express'

import { ISessionUser } from '@src/models/User'

// **** Express **** //

export interface IReq extends e.Request {
  body: any
}

export interface IRes extends e.Response {
  locals: {
    sessionUser?: ISessionUser
  }
}
