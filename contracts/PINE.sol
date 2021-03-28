// SPDX-License-Identifier: MIT

pragma solidity >=0.4.22 <0.9.0;
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v3.4-solc-0.7/contracts/token/ERC20/ERC20.sol";
//https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.3.0-rc.3/contracts/token/ERC20/ERC20.sol
//Flatten the OpenZeppellin so that the truffle migration can work accordingly
//Use solidity compiler version 0.5.17

contract PINE is ERC20 {
    
    string public token_name = "PineappleToken";    //Generated
    string public token_symbol = "PINE";            //Generated
    
    uint256 public token_borrow = 10 ether;         //User key in data
    uint256 public loan_duration = 1095 days;       //User key in data
    
    uint256 public tokenPrice = 0.000001 ether;     //Fix 
    uint256 public initial_token_supply = 1e6;      //Fix
    
    address payable public borrower;                //User key in data
    address payable public tokenWallet;             //Generated
    
    uint256 public ICOStartTime = block.timestamp;
    uint256 public ICOEndTime = block.timestamp + loan_duration;
    bool public ICOCompleted;
    
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
        require(msg.sender == borrower);
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
    
    function destroy() onlyOwner public {
        selfdestruct(borrower);
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
    function distributeInterest(
            uint256 INITIAL_SUPPLY
        ) public payable onlyOwner afterCrowdsale repaymentPeriod{
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

    function Repayment(
            uint256 tokenBuyRate
        ) public payable onlyOwner afterCrowdsale repaymentPeriod {
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
    
    function buyTokens(
            uint256 tokenBuyRate
        ) public payable onlyCrowdsale{
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
            etherUsed = etherUsed - (exceedingEther);
        }
        //Need some additional safety algo to prevent direct call of the transferFrom function
        transferFrom(borrower,msg.sender,uint256(tokensToBuy));
        //Keep track of lenders for future repayment purpose
        saveAddress();
    }
    
    function depositContract() public payable onlyOwner afterCrowdsale repaymentPeriod{
        require(msg.sender != address(0));
        require(balanceOf(tokenWallet) > 0);
    }

    function emergencyExtract() external payable onlyOwner{
        borrower.transfer(address(this).balance);
    }

    constructor() ERC20(token_name,token_symbol){
        borrower = msg.sender;
        _mint(borrower, (initial_token_supply*token_borrow));
    }
}
