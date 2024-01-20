const ABI = [
    {
        inputs: [
            { internalType: "contract IERC20", name: "_token", type: "address" },
            { internalType: "address[]", name: "beneficiaries", type: "address[]" },
            { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
            { internalType: "uint256[]", name: "dates", type: "uint256[]" },
            { internalType: "uint256[]", name: "basisPoints", type: "uint256[]" },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
            { indexed: true, internalType: "address", name: "newOwner", type: "address" },
        ],
        name: "OwnershipTransferred",
        type: "event",
    },
    {
        inputs: [
            { internalType: "address[]", name: "newBeneficiaries", type: "address[]" },
            { internalType: "uint256[]", name: "newAmounts", type: "uint256[]" },
        ],
        name: "addBeneficiaries",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "beneficiary", type: "address" }],
        name: "calculateReward",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    { inputs: [], name: "claim", outputs: [], stateMutability: "nonpayable", type: "function" },
    {
        inputs: [{ internalType: "address", name: "beneficiary", type: "address" }],
        name: "getLastClaimTime",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getVestingBasisPoints",
        outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getVestingDates",
        outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "beneficiary", type: "address" }],
        name: "isParticipantInVesting",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "owner",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
    {
        inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256[]", name: "newDates", type: "uint256[]" },
            { internalType: "uint256[]", name: "newBasisPoints", type: "uint256[]" },
        ],
        name: "updateVestingSchedule",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "", type: "address" }],
        name: "vestingSchedules",
        outputs: [
            { internalType: "uint256", name: "totalAmount", type: "uint256" },
            { internalType: "uint256", name: "claimedAmount", type: "uint256" },
            { internalType: "uint256", name: "lastClaimTime", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
    },
];

import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const claimButtonEl = document.querySelector(".claim-button");
const rewardAmountEl = document.querySelector(".reward-amount");
const vestingCalendarEl = document.querySelector(".content");

const contractAddress = "0x17aDbD63391F195229bf18408dCBf103507e7f41";
const tokenDecimals = 6;
const targetChainId = 56;
// const targetChainId = 11155111;

let signer, contract, walletConnected, userAddress;

async function updateCalendar() {
    const lastClaimTimestamp = await contract.getLastClaimTime(userAddress);
    const vestingDates = await contract.getVestingDates();
    const vestingPercents = await contract.getVestingBasisPoints();
    const userData = await contract.vestingSchedules(userAddress);
    const totalAmount = userData.totalAmount;
    // console.log(lastClaimTimestamp, vestingDates, vestingPercents, userData.totalAmount);
    vestingCalendarEl.innerHTML = "";
    vestingDates.forEach((date, i) => {
        const jsdate = new Date(Number(date) * 1000);
        const amountToClaim = (totalAmount * vestingPercents[i]) / 10000n;
        vestingCalendarEl.insertAdjacentHTML(
            "beforeend",
            `
            <div>${jsdate.toLocaleDateString() + " " + jsdate.toLocaleTimeString()}</div>
            <div class="color-font">${ethers.formatUnits(amountToClaim, tokenDecimals)}</div>
            <div>${date < lastClaimTimestamp ? "claimed" : "not claimed"}</div>
        `
        );
    });
}

async function updateAmountToClaim() {
    const amountToClaim = await contract.calculateReward(userAddress);
    rewardAmountEl.innerHTML = ethers.formatUnits(amountToClaim, tokenDecimals);
}

async function connectWallet() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + targetChainId.toString(16) }],
    });
    claimButtonEl.innerHTML = "CLAIM";
    walletConnected = true;
    userAddress = signer.address;
    contract = new ethers.Contract(contractAddress, ABI, signer);
    await updateCalendar();
    await updateAmountToClaim();
}

async function onClaimBtnClick() {
    if (walletConnected) {
        const tx = await contract.claim();
        await tx.wait();
        await updateCalendar();
        await updateAmountToClaim();
    } else {
        await connectWallet();
    }
}

claimButtonEl.addEventListener("click", onClaimBtnClick);
