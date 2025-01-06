const net = require('net');
const yargs = require('yargs');
require('dotenv').config();

const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 3000;


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
  .option('concurrency', {
    alias: 'C',
    description: 'Number of clients to run concurrently',
    type: 'number',
    default: 100
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
        this.socket = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket = net.createConnection({ host: HOST, port: PORT }, () => {
                console.log(`Client ${this.id}: Connected to server`);
                this.socket.write(this.message);
            });

            this.socket.on('data', (data) => {
                const responseTime = Date.now() - this.startTime;
                console.log(`Client ${this.id}: Received: ${data.toString().trim()} (Response Time: ${responseTime}ms)`);

                stats.successfulResponses += 1;
                stats.totalResponseTime += responseTime;

                this.socket.end();
                resolve();
            });

            this.socket.on('end', () => {
                console.log(`Client ${this.id}: Disconnected from server`);
            })

            this.socket.on('error', (err) => {
                console.error(`Client ${this.id}: Connection error: `, err);
                stats.failedResponses += 1;
                resolve();
            })
        })
    }
}


const NUM_CLIENTS = argv.clients;
const MESSAGE = argv.message;

const createClients = async (num, msg, concurrency) => {
    const clientPromises = [];
    let activeClients = 0;
    let currentClient = 0;

    return new Promise((resolve) => {
        const launchNext = () => {
            if (currentClient >= num) { 
                if (activeClients === 0) {
                    resolve();
                }
                return;
            }

            while (activeClients < concurrency && currentClient < num) { 
                const id = currentClient + 1;
                const client = new Client(id, `Client ${id}: ${msg}`);
                stats.totalRequests += 1;
                activeClients += 1;
                currentClient += 1;

                client.connect().then(() => {
                    activeClients -= 1;
                    launchNext();
                })
                .catch(() => {
                    activeClients -= 1;
                    launchNext();
                });
            }
        };

        launchNext();
    })
}



// 테스트 실행 함수
const runTest = async () => {
    console.log(`Starting test with ${argv.clients} clients, concurrency: ${argv.concurrency}, message: "${argv.message}"`);
    
    const startTestTime = Date.now();
    
    await createClients(argv.clients, argv.message, argv.concurrency);
  
    const totalTestTime = Date.now() - startTestTime;
    const avgResponseTime = stats.successfulResponses > 0 ? (stats.totalResponseTime / stats.successfulResponses).toFixed(2) : 0;
  
    console.log('\n=== Test Statistics ===');
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Successful Responses: ${stats.successfulResponses}`);
    console.log(`Failed Responses: ${stats.failedResponses}`);
    console.log(`Total Response Time: ${stats.totalResponseTime}ms`);
    console.log(`Average Response Time: ${avgResponseTime}ms`);
    console.log(`Total Test Time: ${totalTestTime}ms`);
  };
  
  // 테스트 실행
  runTest();