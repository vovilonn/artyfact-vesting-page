const ABI = [
    {
        inputs: [
            {
                internalType: "contract IERC20",
                name: "_token",
                type: "address",
            },
            {
                internalType: "address[]",
                name: "beneficiaries",
                type: "address[]",
            },
            {
                internalType: "uint256[]",
                name: "amounts",
                type: "uint256[]",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "previousOwner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "OwnershipTransferred",
        type: "event",
    },
    {
        inputs: [
            {
                internalType: "address[]",
                name: "newBeneficiaries",
                type: "address[]",
            },
            {
                internalType: "uint256[]",
                name: "newAmounts",
                type: "uint256[]",
            },
        ],
        name: "addBeneficiaries",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "beneficiary",
                type: "address",
            },
        ],
        name: "calculateReward",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "claim",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "beneficiary",
                type: "address",
            },
        ],
        name: "getLastClaimTime",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "interval",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "beneficiary",
                type: "address",
            },
        ],
        name: "isParticipantInVesting",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "owner",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "repsCount",
        outputs: [
            {
                internalType: "uint16",
                name: "",
                type: "uint16",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "startDate",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        name: "vestingSchedules",
        outputs: [
            {
                internalType: "uint256",
                name: "totalAmount",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "claimedAmount",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "lastClaimTime",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "withdrawTokens",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];

import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const claimButtonEl = document.querySelector(".claim-button");
const rewardAmountEl = document.querySelector(".reward-amount");
const vestingCalendarEl = document.querySelector(".content");

const contractAddress = "0x9D18634e79768635b56c8c00CDf899Bb33b5626f";
const tokenDecimals = 6;
const targetChainId = 56;
// const targetChainId = 11155111;

let signer, contract, walletConnected, userAddress;

let totalVestingAmount = 0;

async function updateCalendar() {
    const lastClaimTimestamp = await contract.getLastClaimTime(userAddress);
    const startDate = await contract.startDate();
    const interval = await contract.interval();
    const repsCount = await contract.repsCount();
    const userData = await contract.vestingSchedules(userAddress);
    const totalAmount = userData.totalAmount;

    const vestingDates = [];

    for (let i = 0; i < repsCount; i++) {
        vestingDates[i] = Number(startDate) + Number(interval) * i;
    }

    vestingCalendarEl.innerHTML = "";

    vestingDates.forEach((date, i) => {
        const jsdate = new Date(Number(date) * 1000);

        const percent = Math.floor((1 * 10000) / Number(repsCount));

        console.log(percent);
        let amountToClaim;
        if (i === vestingDates.length - 1) {
            amountToClaim = Number(totalAmount) - totalVestingAmount;
        } else {
            amountToClaim = (Number(totalAmount) * percent) / 10000;
            totalVestingAmount += amountToClaim;
        }

        console.log(amountToClaim);

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
