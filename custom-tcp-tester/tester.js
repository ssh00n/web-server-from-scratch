const net = require('net');
const yargs = require('yargs');

// 서버 정보
const HOST = '127.0.0.1';
const PORT = 3000;

// args
const argv = yargs
  .option('clients', {
    alias: 'c',
    description: 'Number of concurrent clients',
    type: 'number',
    default: 10
  })
  .option('message', {
    alias: 'm',
    description: 'Message to send',
    type: 'string',
    default: 'Hello from tester!\n'
  })
  .help()
  .alias('help', 'h')
  .argv;

// Statistics
const stats = {
    totalRequests: 0,
    successfulResponses: 0,
    failedResponses: 0,
    totalResponseTime: 0
};



class Client {
    constructor(id, message) {
        this.id = id;
        this.message = message;
        this.startTime = Date.now();
        this.socket = net.createConnection({ host: HOST, port: PORT }, () => {
            console.log(`Client ${this.id}: Connected to server`);
            this.socket.write(this.message);
        })

        this.socket.on('data', (data) => {
            const responseTime = Date.now() - this.startTime;
            console.log(`Client ${this.id}: Received: ${data.toString().trim()} (Response Time: ${responseTime}ms)`);

            stats.successfulResponses += 1;
            stats.totalResponseTime += responseTime;


            this.socket.end();
        })

        this.socket.on('end', () => {
            console.log(`Client ${this.id}: Disconnected from server`);
        });

        this.socket.on('error', (err) => {
            console.error(`Client ${this.id}: Connection error: `, err);

            stats.failedResponses += 1;
        });
    }
}


const NUM_CLIENTS = argv.clients;
const MESSAGE = argv.message;

// 클라이언트 배열
const clients = [];

// 클라이언트 생성
for (let i = 1; i <= NUM_CLIENTS; i++) {
    stats.totalRequests += 1;
    clients.push(new Client(i, `Client ${i}: ${MESSAGE}\n`));
}


// 모든 클라이언트 종료 확인 후 통계 출력
const checkCompletion = setInterval(() => {
    if (stats.successfulResponses + stats.failedResponses === stats.totalRequests) {
        clearInterval(checkCompletion);
        const avgResponseTime = stats.successfulResponses > 0 ? (stats.totalResponseTime / stats.successfulResponses) : 0;
        console.log('\n=== Test Statistics ===');
        console.log(`Total Requests: ${stats.totalRequests}`);
        console.log(`Successful Responses: ${stats.successfulResponses}`);
        console.log(`Failed Responses: ${stats.failedResponses}`);
        console.log(`Total Response TIme: ${stats.totalResponseTime}`);
        console.log(`Average Response Time: ${avgResponseTime}ms`);
    }
}, 1000)