const promisify = require('promisify-node');
const http      = require('http')
const qs        = require('querystring')
const _         = require('lodash')
var   data      = require('./data.json')

var prepareData

prepareData(data)

var {requestOpts} = data

function prepareData (data) {
    const {def, get, set, pin, status, connect, disconnect} = data.requestOpts

    _.update(status, 'data.cmd', (xs) => xs.join(','))

    _.merge(set, def)
    _.merge(get, def)
    _.merge(pin, set)
    _.merge(status, get)
    _.merge(connect, set)
    _.merge(disconnect, set)
    
    return data
}

function handleResponse (stream) {
    return new Promise((resolve, reject) => {
	var result = "";
	stream
	    .on('end', () => resolve(JSON.parse(result)))
	    .on('error', e => reject(e))
	    .on('data', chunk => result += chunk)
    })
}

function request (opts) {
    var opts = _.cloneDeep(opts)
    const data_str = qs.stringify(opts.data)
    const {method} = opts 
    
    delete opts.data

    if (method == "POST") {
	opts.headers["Content-Length"] = data_str.length
    } else if (method == "GET") {
	opts.path += "?" + data_str
    }
    
    return new Promise((resolve, reject) => {
	const req = http
	      .request(opts)
	      .on('response', res => handleResponse(res).then(resolve))
	      .on('error', err => reject(err))
	      .end(method == "POST" ? data_str : "")
    })
}

function log (txt) {
    console.log(txt)
}

function logMsg (id) {
    log(data.messages[id])
}

function logError (id) {
    log(data.errors[id])
}

function parseStatus (input) {
    const bytesReplace = {
	'monthly_rx_bytes':  'monthly_down_mb',
	'monthly_tx_bytes':  'monthly_up_mb',
	'monthly_time':      'monthly_time',
	'realtime_rx_bytes': 'realtime_down_mb',
	'realtime_tx_bytes': 'realtime_up_mb',
	'realtime_time':     'realtime_time'
    }
    
    const bytesToMB = n => _.round(n / 1024 / 1024, 2)
    
    const mapKeyValue = (obj, f) =>
	_.fromPairs(_.map(_.toPairs(obj), ([k, v]) => f (k, v)))

    input = mapKeyValue(input, (k, v) => {
	return _.has(bytesReplace, k) &&
	    [_.get(bytesReplace, k), bytesToMB(_.toInteger(v))] ||
	    [k, v]
    })

    return input
}

function pprint (obj) {
    log(JSON.stringify(obj, null, 2))
}

const tasks = {}

tasks.status = function() {
    logMsg('get_status')
    request(requestOpts.status)
        .then(_.flow([parseStatus, pprint]))
	.catch(() => logError('failed'))
}

tasks.pin = function (pin) {
    logMsg('sending_pin')
    const opts = _.merge({}, requestOpts.pin, {
	data: {
	    PinNumber: pin
	}
    })
    request(opts)
       	.then(() => logMsg('ok'))
	.catch(() => logError('failed'))
}

tasks.connect = function () {
    logMsg('connecting')
    request(requestOpts.connect)
    	.then(() => logMsg('ok'))
	.catch(() => logError('failed'))
}

tasks.disconnect = function () {
    log('connecting')
    request(requestOpts.disconnect)
        .then(() => logMsg('ok'))
	.catch(() => logError('failed'))
}

tasks.help = function () {
    logMsg('help_txt')
    log((_.keys(tasks)).join(', '))
}

function main () {
    const [,,task, ...args] = process.argv;
    const taskFn = tasks[task] || tasks.help

    taskFn.apply(this, args)
}

main()
