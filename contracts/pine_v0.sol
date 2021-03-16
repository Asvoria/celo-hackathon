// SPDX-License-Identifier: MIT

//pragma solidity ^0.5.8;
pragma solidity >=0.4.22 <0.9.0;
import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

/*
contract MyCollectible is ERC20 {
    constructor() public ERC20("MyCollectible", "MCO") {
    }
}
*/


contract PINE is ERC20 {
    //string memory name = string("PINEtoken");
    //string memory symbol = string("PINE");
    //uint256 internal decimals = 18;


	uint256 public INITIAL_SUPPLY = 1e5;
    //
	address payable public tokenWallet;
    address payable public owner;
    
    uint256 public ICOStartTime = block.timestamp;
    uint256 public ICOEndTime = block.timestamp + 60;
    bool public ICOCompleted;
    uint256 public constant tokenBuyRate = 0.001 ether;
    
    uint256 public RepaymentStartTime;
    uint256 public RepaymentCount;
    uint256 public monthlySalary = 0;

    address[] public lenders;
    

    modifier whenIcoCompleted{
        require(ICOCompleted);
        _;
    }
    
    modifier onlyCrowdsale{
        require(block.timestamp < ICOEndTime && block.timestamp > ICOStartTime);
        _;
    }

    modifier onlyOwner{
        require(msg.sender == owner);
        _;
    }

    modifier afterCrowdsale{
        require(block.timestamp > ICOEndTime);
        _;
    }
    
    modifier repaymentPeriod{
        require(block.timestamp > RepaymentStartTime);
        _;
    }

    function saveAddress() payable public {
        lenders.push(msg.sender);
    }
    
    //Call function to start repayment period
    function startRepayment(uint256 _monthlySalary, uint256 _RepaymentCount) public onlyOwner afterCrowdsale returns(bool){
        RepaymentStartTime = block.timestamp;
        monthlySalary = _monthlySalary * (1 ether); //when input, it is in wei
        RepaymentCount = _RepaymentCount;
        //endBurnLeftoverToken();
        return true;
    }
    
    //Can only start to distribute interest after the repayment period started
    function distributeInterest() public payable onlyOwner afterCrowdsale repaymentPeriod{
        //Interest is 5%per anum of monthly reported salary. monthlySalary
        require(monthlySalary > 0);
        uint256 InterestRate = (monthlySalary/100)* (5)/(INITIAL_SUPPLY);
        uint256 InterestCalc = 0 ether;
        for (uint i=0; i<lenders.length; i++) {
            address payable makePayAdd = address(uint160(lenders[i]));


            InterestCalc = balanceOf(makePayAdd) * (InterestRate);
            require (InterestCalc > 0, "Amount is less than the minimum value");
            require (msg.sender.balance >= InterestCalc, "Contract balance is empty");
            makePayAdd.transfer(InterestCalc); //ether must be in contract balance
        }
    }
    /*
    function endBurnLeftoverToken() public afterCrowdsale onlyOwner{
        totalSupply = totalSupply() - (balanceOf(msg.sender));
        emit Transfer(msg.sender, address(0), balanceOf(msg.sender));
        balanceOf(msg.sender) = 0;
    }
    */
    function Repayment() public payable onlyOwner afterCrowdsale repaymentPeriod {
        uint256 tokensRepay;
        uint256 tokensRepayEther = 0 ether;
        
        for (uint i=0; i<lenders.length; i++) {
            address payable makePayAdd = address(uint160(lenders[i]));
            
            tokensRepay = balanceOf(makePayAdd)/(RepaymentCount);
            tokensRepayEther = tokensRepay*(tokenBuyRate);
            
            require (tokensRepayEther > 0, "Amount is less than the minimum value");
            require (msg.sender.balance >= tokensRepayEther, "Contract balance is empty");
            
            makePayAdd.transfer(tokensRepayEther); //ether must be in contract balance
            transferFrom(makePayAdd,msg.sender,tokensRepay);
        }
        
        //burn the repaid tokens here
        //endBurnLeftoverToken();
        RepaymentCount--;
    }
    
    function buyTokens() public payable onlyCrowdsale{
        require(msg.sender != address(0));
        require(balanceOf(tokenWallet) > 0);
        
        uint256 etherUsed = uint256(msg.value);
        require(etherUsed > 0);
        uint256 tokensToBuy = etherUsed/(tokenBuyRate);
        
        // Return extra ether when tokensToBuy > balances[tokenWallet]
        if(tokensToBuy > balanceOf(tokenWallet)){
            uint256 exceedingTokens = tokensToBuy - (balanceOf(tokenWallet));
            uint256 exceedingEther = 0 ether;

            exceedingEther = exceedingTokens * (tokenBuyRate);
            msg.sender.transfer(exceedingEther);
            tokensToBuy = tokensToBuy - (exceedingTokens);
            etherUsed = etherUsed -(exceedingEther);
        }
        //Need some additional safety algo to prevent direct call of the transferFrom function
        transferFrom(owner,msg.sender,uint256(tokensToBuy));
        //Keep track of lenders for future repayment purpose
        saveAddress();
    }
    
    function depositContract() public payable onlyOwner afterCrowdsale repaymentPeriod{
        require(msg.sender != address(0));
        require(balanceOf(tokenWallet) > 0);
    }

    function emergencyExtract() external payable onlyOwner{
        owner.transfer(address(this).balance);
    }
	

	//constructor () public ERC20("PineappleToken","PINE"){
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply
     ) ERC20(name,symbol){
        totalSupply = INITIAL_SUPPLY;
        owner = msg.sender;
        tokenWallet = owner;
        _mint(msg.sender, totalSupply);
        //_mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
        //balanceOf(tokenWallet) = INITIAL_SUPPLY;
    }
}
