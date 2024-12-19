'use strict';
var CryptoJS = require("crypto-js");
var express = require("express");
var bodyParser = require('body-parser');
var WebSocket = require("ws");

var http_port = process.env.HTTP_PORT || 3001;

class Block {
    constructor(index, previousHash, timestamp, data, hash) {
        this.index = index;
        this.previousHash = previousHash.toString();
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash.toString();
        
    }
}

var sockets = [];



var getGenesisBlock = () => { 
    return new Block(0, "0", 1465154705, "my genesis block!!", 
   ""); 
   };

   var blockchain = [getGenesisBlock()];
    let initHttpServer = () => {
    let app = express();
    app.arguments(bodyParser.json());

    app.get('/blocks', (req, res) => res.send(JSON.stringify(blockchain)));
    app.post('/mineBlock', (req, res) => {
        let newBlock = generateNextBlock(req.body.data);
        addBlock(newBlock);
        console.log('block added: ' + JSON.stringify(newBlock));
        res.send();
    });
    app.get('/peers', (req, res) => {
        res.send(sockets.map(s => s._socket.remoteAdrress + ':' + s._socket.remotePort));
    });
    app.post('/addPeer', (req, res) => {
        res.send();
    });
    app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
};
  
var generateNextBlock = (blockData) => {
    var previousBlock = getLatestBlock();
    var nextIndex = previousBlock.index + 1;
    var nextTimestamp = new Date().getTime() / 1000;
    var nextHash = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
    return new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData, nextHash);
   }

var calculateHashForBlock = (block) => {
        return calculateHash(block.index, block.previousHash, block.timestamp, block.data);
   }

 var calculateHash = (index, previousHash, timestamp, data) => {
        return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
   };

   var addBlock = (newBlock) => {
        if (isValidNewBlock(newBlock, getLatestBlock())) {
            blockchain.push(newBlock);
        }
    }

   var isValidNewBlock = (newBlock, previousBlock) => {
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    }else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previous Hash');
        return false;
    }else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log(typeof (newBlock.hash) + ' '+ typeof calculateHashForBlock(newBlock));
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' '+ newBlock.hash);
        return false;
    }
    return true;
   }
var replaceChain = (newBlocks) => {
        if (isValidChain(newBlocks) && newBlocks.length > blockchain.length) {
            console.log('received blockchain is valid. Replacing current blockchain with received blockchain');
            blockchain = newBlocks;
        } else {
            console.log('Received blockchain is invalid');
        }
    };
   
    var isValidChain = (blockchainToValidate) => {
        if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(getGenesisBlock())) {
            return false;
        }
        var tempBlocks = [blockchainToValidate[0]];
        for (let i = 1; i < blockchainToValidate.length; i++) {
            if (isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
                tempBlocks.push(blockchainToValidate[i]);
            } else {
                return false;
            }
        }
        return true;
    };

 var getLatestBlock = () => blockchain[blockchain.length - 1];
// function testApp() {
//     function showBlockchain(inputBlockchain) {
//         for (let i = 0; i < inputBlockchain.length; i++) {
//             console.log(inputBlockchain[i]);
//         }
//         console.log();
//     }

//     showBlockchain(blockchain);

    // console.log(calculateHashForBlock(getGenesisBlock()));

//     // addBlock test
//     console.log('blockchain before addBlock() execution:');
//     showBlockchain(blockchain);
//     addBlock(generateNextBlock('test block data'));
//     console.log('\n');
//     console.log('blockchain after addBlock() execution:');
//     showBlockchain(blockchain);
// }   

// testApp();
initHttpServer();