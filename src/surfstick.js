const http = require('http')
const qs   = require('querystring')

const [,,pin] = process.argv;

const hostname = "192.168.0.1"

const errors = {
    network: 'Network Error',
    api:     'API Error'
}

const msgs = {
    sending_pin: 'Sending PIN...',
    connecting:  'Connecting...',
    ok:          'ok'
}

const headers =  {
    'User-Agent':       'Mozilla/5.0',
    'Accept':           'application/json, text/javascript, */*; q=0.01',
    'Accept-Language':  'en-US,en;q=0.5',
    'Accept-Encoding':  'gzip, deflate',
    'Content-Type':     'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer':          'http://192.168.0.1/index.html',
    'DNT':              1,
    'Connection':       'keep-alive'
}

const options = {
    hostname: hostname,
    port:     80,
    path:     '/goform/goform_set_cmd_process',
    method:   'POST',
    headers:  headers
}

const enterPinData = {
    goformId:  'ENTER_PIN',
    PinNumber: pin,
    isTest:    false
}

const connectData = {
    notCallback: true,
    goformId:    'CONNECT_NETWORK',
    isTest:      false
}

function readStream (stream) {
    return new Promise((resolve, reject) => {
	var result = "";
	stream
	    .on('end', () => resolve(result))
	    .on('error', e => reject(e))
	    .on('data', chunk => result += chunk)
    })
}

const isSuccess = r => {
    return r.result && r.result === "success"
}


function request (postData) {
    return new Promise((resolve, reject) => {
	const postStr = qs.stringify(postData)
        const handleResult = data => {
	    isSuccess(data) && resolve(data) || reject(errors.api)
	}
	options.headers['Content-Length'] = postStr.length
	http
	    .request(options, (res) => readStream(res)
		     .then(x => JSON.parse(x))
		     .then(handleResult))
	    .on('error', e => reject(errors.network))
	    .end(postStr)
    })
}

function validate () {
    return pin && true;
}

const logMsg = (id) => console.log(msgs[id])
const logErr = (id) => console.log(errors[id])
const logOK = () => logMsg('ok')

function main () {
    logMsg('sending_pin');
    request(enterPinData)
    	.then(() => logMsg('ok'))
    
        .then(() => logMsg('connecting'))
        .then(() => request(connectData))
        .then(() => logMsg('ok'))
	.catch(e => logErr(e))
}

validate() && main();
