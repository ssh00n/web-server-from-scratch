const net = require('net');

const HOST = '127.0.0.1';
const PORT = 3000;


const server = net.createServer((socket) => {
    console.log('New client connected');

    // TODO: 연결된 클라이언트 정보 인터페이스 정의
    

    socket.on('data', (data) => {
        console.log('Received data:', data.toString());
        socket.write('Hello from custom TCP Server!\n');
    });

    socket.on('end', () => {
        console.log('Client connection ended.');
    });

    socket.on('error', (err) => {
        console.error('Socket Error', err);
    });
    
});

server.listen(PORT, HOST, () => {
    console.log(`TCP Server Running in ${HOST}:${PORT}.`)
})