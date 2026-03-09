// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

library FeeLogic {
    uint256 internal constant PERCENTAGE_FACTOR = 1e4;

    function calculateTotalFee(
        uint256 _amount,
        uint256 _ratio
    ) internal pure returns (uint256) {
        if (_ratio == 0 || _amount == 0) return 0;

        return (_amount * _ratio) / PERCENTAGE_FACTOR;
    }

    function calculateFeePerTaker(
        uint256 _amount,
        uint256 _takers
    ) internal pure returns (uint256) {
        if (_takers == 0 || _amount == 0) return 0;

        return _amount / _takers;
    }
}
