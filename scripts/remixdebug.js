(async () => {
    const account1 = '0xa891cCC01EC6532Bcbe666aFd766b1C696380736'
    
    const contractAddress = '0x2a5f22b96163c9aE357d8868f15604272D8CeDc7'
    console.log('start...')
    
    const metadata = JSON.parse(await remix.call('fileManager', 'getFile', 'github/Asvoria/celo-hackathon-smartloan/contracts/artifacts/PINE.json'))
    console.log('done getfile...')
    const accounts = await web3.eth.getAccounts()
    
    let contract = new web3.eth.Contract(metadata.abi, contractAddress)
    console.log('call...')
    contract.methods.buyTokens(100).send({ 
        from: account1,
        to: contractAddress,
        value: '100000000000000000',
        gasPrice: '1000000000',
        gasLimit: '210000'
    }).on('receipt', async (receipt) => {
        console.log(receipt)
        const result = await contract.methods.balanceOf(account1).call({from: account1})
        console.log('balance_', result)
    })
})()
