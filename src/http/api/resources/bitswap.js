'use strict'

const boom = require('boom')
const Joi = require('joi')
const multibase = require('multibase')
const { cidToString } = require('../../../utils/cid')
const parseKey = require('./block').parseKey

exports = module.exports

exports.wantlist = {
  validate: {
    query: Joi.object().keys({
      'cid-base': Joi.string().valid(multibase.names)
    }).unknown()
  },

  handler: (request, reply) => {
    const peerId = request.query.peer
    const cidBase = request.query['cid-base']

    request.server.app.ipfs.bitswap.wantlist(peerId, { cidBase }, (err, list) => {
      if (err) {
        return reply(boom.badRequest(err))
      }
      reply({ Keys: list })
    })
  }
}

exports.stat = {
  validate: {
    query: Joi.object().keys({
      'cid-base': Joi.string().valid(multibase.names)
    }).unknown()
  },

  handler: (request, reply) => {
    const ipfs = request.server.app.ipfs
    const cidBase = request.query['cid-base']

    ipfs.bitswap.stat({ cidBase }, (err, stats) => {
      if (err) {
        return reply({
          Message: err.toString(),
          Code: 0
        }).code(500)
      }

      reply({
        ProvideBufLen: stats.provideBufLen,
        BlocksReceived: stats.blocksReceived,
        Wantlist: stats.wantlist.map(cid => ({ '/': cid })),
        Peers: stats.peers,
        DupBlksReceived: stats.dupBlksReceived,
        DupDataReceived: stats.dupDataReceived,
        DataReceived: stats.dataReceived,
        BlocksSent: stats.blocksSent,
        DataSent: stats.dataSent
      })
    })
  }
}

exports.unwant = {
  validate: {
    query: Joi.object().keys({
      'cid-base': Joi.string().valid(multibase.names)
    }).unknown()
  },

  // uses common parseKey method that assigns a `key` to request.pre.args
  parseArgs: parseKey,

  // main route handler which is called after the above `parseArgs`, but only if the args were valid
  handler: (request, reply) => {
    const key = request.pre.args.key
    const ipfs = request.server.app.ipfs
    ipfs.bitswap.unwant(key, (err) => {
      if (err) {
        return reply(boom.badRequest(err))
      }
      reply({ key: cidToString(key, request.query['cid-base']) })
    })
  }
}
