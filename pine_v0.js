// This script requires that you have already deployed HelloWorld.sol with Truffle
// Go back and do that if you haven't already
const path = require('path')

//Contract address deployed under remix ide
const contractAddress = '0x45b3f1E4054c1A90985b0192536b909C76655Ce5'

const userAccount = path.join(__dirname, './.buyer')
const sellerAccount = path.join(__dirname, './.seller')
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
    await buyTokens(instance)
}

// Read the 'name' stored in the HelloWorld.sol contract
async function getName(instance){
    let name = await instance.methods.name().call()
    console.log(name)
}

// Set the 'name' stored in the HelloWorld.sol contract
async function buyTokens(instance){
    let account = await getAccount(userAccount)
    let sellAccount = await getAccount(sellerAccount)
    let accountContract = await getAccount(contractAccount)

    console.log("### Before buyToken transaction: ")

    let BBalanceOf = await instance.methods.balanceOf(account.address).call()
    console.log(account.address)
    console.log("Token Balance: "+BBalanceOf)

    let SBalanceOf = await instance.methods.balanceOf(sellAccount.address).call()
    console.log(sellAccount.address)
    console.log("Token Balance: "+SBalanceOf)

    // Add your account to ContractKit to sign transactions
    // This account must have a CELO balance to pay tx fees, get some https://celo.org/build/faucet
    kit.connection.addAccount(sellAccount.privateKey)
    kit.connection.addAccount(account.privateKey)

    const amountToBuy = kit.web3.utils.toWei('1', 'ether')
    const oneGold = kit.web3.utils.toWei('1', 'ether')
    const gasFee = kit.web3.utils.toWei('13', 'mwei')
    
    //Try call openZeppelin's approval
    //Need to have approval of Owner:contractWallet Spender:account.address
    let txObjectApprove = await instance.methods.approve(account.address,oneGold)
    // Send the transaction
    let txApprove = await kit.sendTransactionObject(txObjectApprove, { 
        from: sellAccount.address
    })
    const hashApprove = await txApprove.getHash()
    let receiptApprove = await txApprove.waitReceipt()

    //buyTokens from who?
    let txObject = await instance.methods.buyTokens(sellAccount.address)
    // Send the transaction
    let tx = await kit.sendTransactionObject(txObject, { 
        from: account.address,
        value: amountToBuy,
        gas: gasFee
    })
    const hash = await tx.getHash()
    let receipt = await tx.waitReceipt()
    await console.log(receipt)

    console.log("### After buyToken transaction: ")

    BBalanceOf = await instance.methods.balanceOf(account.address).call()
    console.log(account.address)
    console.log("Token Balance: "+BBalanceOf)

    SBalanceOf = await instance.methods.balanceOf(sellAccount.address).call()
    console.log(sellAccount.address)
    console.log("Token Balance: "+SBalanceOf)
}


initContract()
