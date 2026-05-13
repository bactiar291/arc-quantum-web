// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IQuantumTokenLike {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IQuantumFactoryLike {
    function getPair(address tokenA, address tokenB) external view returns (address);
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

interface IQuantumPairLike {
    function mint(address to) external returns (uint256 liquidity);
    function swapExact(address tokenIn, uint256 amountIn, uint256 amountOutMin, address to) external returns (uint256 amountOut);
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256 amountOut);
    function token0() external view returns (address);
    function reserve0() external view returns (uint256);
    function reserve1() external view returns (uint256);
}

contract QuantumRouter {
    address public immutable factory;

    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, "EXPIRED");
        _;
    }

    constructor(address factory_) {
        require(factory_ != address(0), "FACTORY");
        factory = factory_;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        address pair = IQuantumFactoryLike(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            pair = IQuantumFactoryLike(factory).createPair(tokenA, tokenB);
        }

        require(IQuantumTokenLike(tokenA).transferFrom(msg.sender, pair, amountADesired), "TOKEN_A");
        require(IQuantumTokenLike(tokenB).transferFrom(msg.sender, pair, amountBDesired), "TOKEN_B");
        liquidity = IQuantumPairLike(pair).mint(to);
        amountA = amountADesired;
        amountB = amountBDesired;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        require(path.length == 2, "PATH");
        address pair = IQuantumFactoryLike(factory).getPair(path[0], path[1]);
        require(pair != address(0), "PAIR");

        amounts = getAmountsOut(amountIn, path);
        require(amounts[1] >= amountOutMin, "SLIPPAGE");
        require(IQuantumTokenLike(path[0]).transferFrom(msg.sender, pair, amountIn), "TRANSFER");
        IQuantumPairLike(pair).swapExact(path[0], amountIn, amountOutMin, to);
    }

    function getAmountsOut(
        uint256 amountIn,
        address[] memory path
    ) public view returns (uint256[] memory amounts) {
        require(path.length == 2, "PATH");
        address pair = IQuantumFactoryLike(factory).getPair(path[0], path[1]);
        require(pair != address(0), "PAIR");

        address token0 = IQuantumPairLike(pair).token0();
        (uint256 reserveIn, uint256 reserveOut) = path[0] == token0
            ? (IQuantumPairLike(pair).reserve0(), IQuantumPairLike(pair).reserve1())
            : (IQuantumPairLike(pair).reserve1(), IQuantumPairLike(pair).reserve0());

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = IQuantumPairLike(pair).getAmountOut(amountIn, reserveIn, reserveOut);
    }
}
