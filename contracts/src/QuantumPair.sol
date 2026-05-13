// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IQuantumERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract QuantumPair {
    string public constant name = "Quantum LP";
    string public constant symbol = "QLP";
    uint8 public constant decimals = 18;
    uint256 private constant MINIMUM_LIQUIDITY = 1000;

    address public immutable factory;
    address public token0;
    address public token1;
    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Swap(address indexed sender, address indexed tokenIn, uint256 amountIn, uint256 amountOut, address indexed to);
    event Sync(uint256 reserve0, uint256 reserve1);

    modifier onlyFactory() {
        require(msg.sender == factory, "FORBIDDEN");
        _;
    }

    constructor() {
        factory = msg.sender;
    }

    function initialize(address token0_, address token1_) external onlyFactory {
        require(token0 == address(0) && token1 == address(0), "INIT");
        token0 = token0_;
        token1 = token1_;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "ALLOWANCE");
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to) external returns (uint256 liquidity) {
        uint256 balance0 = IQuantumERC20(token0).balanceOf(address(this));
        uint256 balance1 = IQuantumERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0 - reserve0;
        uint256 amount1 = balance1 - reserve1;

        if (totalSupply == 0) {
            liquidity = sqrt(amount0 * amount1);
            require(liquidity > MINIMUM_LIQUIDITY, "LOW_LIQ");
            _mint(address(0xdead), MINIMUM_LIQUIDITY);
            liquidity -= MINIMUM_LIQUIDITY;
        } else {
            liquidity = min(
                (amount0 * totalSupply) / reserve0,
                (amount1 * totalSupply) / reserve1
            );
        }

        require(liquidity > 0, "LOW_LIQ");
        _mint(to, liquidity);
        _update(balance0, balance1);
        emit Mint(msg.sender, amount0, amount1);
    }

    function swapExact(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) external returns (uint256 amountOut) {
        require(tokenIn == token0 || tokenIn == token1, "TOKEN");
        require(to != token0 && to != token1, "TO");

        bool zeroForOne = tokenIn == token0;
        (uint256 reserveIn, uint256 reserveOut) = zeroForOne
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "SLIPPAGE");

        address tokenOut = zeroForOne ? token1 : token0;
        require(IQuantumERC20(tokenOut).transfer(to, amountOut), "TRANSFER");

        _update(
            IQuantumERC20(token0).balanceOf(address(this)),
            IQuantumERC20(token1).balanceOf(address(this))
        );
        emit Swap(msg.sender, tokenIn, amountIn, amountOut, to);
    }

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "LIQ");
        uint256 amountInWithFee = amountIn * 997;
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
    }

    function _update(uint256 balance0, uint256 balance1) private {
        reserve0 = balance0;
        reserve1 = balance1;
        emit Sync(balance0, balance1);
    }

    function _mint(address to, uint256 amount) private {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _transfer(address from, address to, uint256 amount) private {
        require(to != address(0), "ZERO_TO");
        require(balanceOf[from] >= amount, "BALANCE");
        unchecked {
            balanceOf[from] -= amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
    }

    function min(uint256 x, uint256 y) private pure returns (uint256) {
        return x < y ? x : y;
    }

    function sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
