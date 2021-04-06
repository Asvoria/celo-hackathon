// This script requires that you have already deployed HelloWorld.sol with Truffle
// Go back and do that if you haven't already

//Contract address deployed under remix ide
const contractAddress = '0x14ac8A076eD88B848B39975e7AeAce3D1F3415A1'

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
    buyTokens(instance)
}

// Read the 'name' stored in the HelloWorld.sol contract
async function getName(instance){
    let name = await instance.methods.name().call()
    console.log(name)
}

// Set the 'name' stored in the HelloWorld.sol contract
async function buyTokens(instance){
    let account = await getAccount()
    console.log(account.address)

    // Add your account to ContractKit to sign transactions
    // This account must have a CELO balance to pay tx fees, get some https://celo.org/build/faucet
    kit.connection.addAccount(account.privateKey)

    const amountToBuy = kit.web3.utils.toWei('1', 'ether')
    const oneGold = kit.web3.utils.toWei('1', 'ether')
    //console.log(oneGold)

    const goldToken = await kit.contracts.getGoldToken()
    //console.log(goldToken)
    const approveTx = await goldToken.approve(account.address, amountToBuy).send({from:account.address})
    //console.log(approveTx)
    const approveReceipt = await approveTx.waitReceipt()
    //console.log(approveReceipt)
    
    let txObject = await instance.methods.buyTokens()
    
    // Send the transaction
    let tx = await kit.sendTransactionObject(txObject, { 
        from: account.address,
        to: contractAddress,
        value: oneGold,
        gas: 13000000
    })
    const hash = await tx.getHash()
    let receipt = await tx.waitReceipt()
    //console.log(receipt)
    
}


initContract()
