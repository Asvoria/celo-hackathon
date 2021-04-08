// This script requires that you have already deployed HelloWorld.sol with Truffle
// Go back and do that if you haven't already
const path = require('path')

//Contract address deployed under remix ide
const contractAddress = '0x79040D6785f6806B7bcB14EBeca716E989567c43'
const contractWallet = '0x52395CC8b9d510D45C97476F4602c13B17877e25'

const userAccount = path.join(__dirname, './.secret')
const contractAccount = path.join(__dirname, './.secretContract')

// 1. Import web3 and contractkit 
const Web3 = require("web3")
const ContractKit = require('@celo/contractkit')

// 2. Import the getAccount function
const getAccount = require('./getAccount').getAccount

// 3. Init a new kit, connected to the alfajores testnet
const web3 = new Web3('https://alfajores-forno.celo-testnet.org')
const kit = ContractKit.newKitFromWeb3(web3)

// import contract json
const PINE = require('./contracts/artifacts/PINE.json')



// Initialize a new Contract interface
async function initContract(){



    // Check the Celo network ID
    const networkId = await web3.eth.net.getId();
    //const deployedNetwork = PINE.networks[networkId];
    
    //console.log('deployedNetwork.address',deployedNetwork.address)
    //deployedNetwork.address = contractAddress
    // Create a new contract instance with the HelloWorld contract info
    let instance = new web3.eth.Contract(
        PINE.abi,
        contractAddress
    );

    getName(instance)
    //the approaval process does not work on vscode
    buyTokens(instance)
}

// Read the 'name' stored in the HelloWorld.sol contract
async function getName(instance){
    let name = await instance.methods.name().call()
    console.log(name)
}

// Set the 'name' stored in the HelloWorld.sol contract
async function buyTokens(instance){
    let account = await getAccount(userAccount)
    let accountContract = await getAccount(contractAccount)
    // paid gas in cUSD

    // Add your account to ContractKit to sign transactions
    // This account must have a CELO balance to pay tx fees, get some https://celo.org/build/faucet
    kit.connection.addAccount(accountContract.privateKey)
    console.log(accountContract.address)
    

    const amountToBuy = kit.web3.utils.toWei('9000000', 'gwei')
    const oneGold = kit.web3.utils.toWei('9000000', 'gwei')
    const gasFee = kit.web3.utils.toWei('13', 'mwei')
    //console.log(oneGold)

    /*
    const goldToken = await kit.contracts.getGoldToken()
    const approveTx = await goldToken.approve(contractWallet, oneGold+gasFee).send({from:account.address})
    const approveReceipt = await approveTx.waitReceipt()
    //console.log(approveReceipt)
    */
    
    //Try call openZeppelin's approval
    //Need to have approval of Owner:contractWallet Spender:account.address
    let txObjectApprove = await instance.methods.approve(account.address,oneGold)
    // Send the transaction
    let txApprove = await kit.sendTransactionObject(txObjectApprove, { 
        from: accountContract.address
    })
    const hashApprove = await txApprove.getHash()
    let receiptApprove = await txApprove.waitReceipt()

    kit.connection.addAccount(account.privateKey)
    console.log(account.address)
    
    
    let txObject = await instance.methods.buyTokens()
    // Send the transaction
    let tx = await kit.sendTransactionObject(txObject, { 
        from: account.address,
        value: amountToBuy,
        gas: gasFee
    })
    const hash = await tx.getHash()
    let receipt = await tx.waitReceipt()
    console.log(receipt)

}


initContract()
