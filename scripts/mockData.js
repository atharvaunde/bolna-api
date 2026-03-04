require('dotenv').config();
const Customer = require('../models/customers');
const Product = require('../models/products');
const Transaction = require('../models/transactions');
const RiskScore = require('../models/riskScores');
const Calls = require('../models/calls');
const {disconnectDB, connectDB} = require('../configs/database')

const START_DATE = new Date('2026-01-01');
const END_DATE = new Date('2026-12-31');

const random = (min, max) => Math.floor(Math.random() * (max - min) + min);
const randomFloat = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const pick = (arr) => arr[random(0, arr.length)];

const behaviorProfiles = ['FINANCIALLY_HEALTHY', 'MEDIUM_RISK', 'HIGH_RISK', 'NEAR_DEFAULT'];

function randomProfile() {
    return behaviorProfiles[random(0, behaviorProfiles.length)];
}

let txnCounter = 0;
function txnId() {
    txnCounter++;
    return 'TXN' + Date.now() + String(txnCounter).padStart(8, '0');
}

const firstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Sai', 'Arnav',
    'Dhruv', 'Kabir', 'Ananya', 'Diya', 'Ishita', 'Priya', 'Sneha', 'Kavya',
    'Riya', 'Nisha', 'Meera', 'Tanvi',
];
const lastNames = [
    'Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Reddy', 'Nair',
    'Joshi', 'Mehta', 'Deshmukh', 'Iyer', 'Shah', 'Bhat', 'Rao', 'Choudhary',
    'Das', 'Pillai', 'Kulkarni', 'Menon',
];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];
const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'Maharashtra', 'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh'];
const occupations = ['Software Engineer', 'Doctor', 'Business Owner', 'Teacher', 'Chartered Accountant', 'Civil Engineer', 'Banker', 'Consultant', 'Manager', 'Professor'];
const employers = ['TCS', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra', 'Reliance Industries', 'HDFC Bank', 'Apollo Hospitals', 'Tata Motors', 'Bharti Airtel'];
const incomeSources = ['Salary', 'Business Income', 'Consulting Fees', 'Rental Income', 'Professional Fees'];
const channels = ['MOBILE_APP', 'INTERNET_BANKING', 'BRANCH', 'ATM', 'POS', 'API'];
const merchantCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Online'];

const branches = [
    { code: 'MUM001', ifsc: 'DEMO0MUM001' },
    { code: 'DEL002', ifsc: 'DEMO0DEL002' },
    { code: 'BLR003', ifsc: 'DEMO0BLR003' },
    { code: 'HYD004', ifsc: 'DEMO0HYD004' },
    { code: 'CHN005', ifsc: 'DEMO0CHN005' },
    { code: 'PUN006', ifsc: 'DEMO0PUN006' },
];

const upiMerchants = [
    'Swiggy Online Services', 'Zomato Food Delivery', 'Amazon Pay Merchant',
    'PhonePe Merchant', 'Google Pay Transfer', 'Paytm Wallet Load',
    'BigBasket Groceries', 'Dunzo Delivery', 'Uber India', 'Ola Cabs',
    'Flipkart Marketplace', 'DMart Ready', 'Apollo Pharmacy', 'BookMyShow',
    'MakeMyTrip', 'Zepto Quick Commerce', 'Blinkit Groceries', 'Cred Bill Pay',
];

const neftBeneficiaries = [
    'Rajesh Sharma – HDFC Bank', 'Priya Patel – ICICI Bank', 'Amit Kumar – SBI',
    'Mutual Fund SIP – Axis AMC', 'Insurance Premium – LIC', 'Society Maintenance – HSG Soc',
    'Tuition Fee – ABC School', 'Medical Payment – Max Healthcare',
];

const impsBeneficiaries = [
    'Savings Transfer – Self Account', 'Family Support – Parent Account',
    'Rent Payment – Landlord', 'Freelance Payment Received', 'EMI Pre-payment Transfer',
];

const atmBranches = [
    'Mumbai Andheri West Branch', 'Delhi Connaught Place Branch', 'Bangalore Koramangala Branch',
    'Hyderabad Banjara Hills Branch', 'Chennai T Nagar Branch', 'Pune Hinjewadi Branch',
    'Mumbai Powai Branch', 'Delhi Saket Branch', 'Bangalore Whitefield Branch',
];

const cardMerchants = [
    'Amazon India', 'Flipkart Online', 'Reliance Digital', 'Croma Electronics',
    'Shoppers Stop', 'Lifestyle International', 'Myntra Fashion', 'Ajio Retail',
    'Decathlon Sports', 'IKEA India', 'Nykaa Beauty', 'Tata CLiQ',
    'HP Petrol Pump', 'Indian Oil Station', 'BPCL Fuel Station',
    'PVR Cinemas', 'Starbucks India', 'Haldirams Restaurant',
    'Taj Hotels', 'Marriott Hotels', 'MakeMyTrip Flights',
];

const subscriptionServices = [
    'Netflix Subscription', 'Amazon Prime Membership', 'Spotify Premium',
    'YouTube Premium', 'Hotstar VIP', 'Adobe Creative Cloud',
    'Microsoft 365', 'Apple iCloud Storage', 'LinkedIn Premium',
    'Gym Membership – Cult.fit',
];

const standingInstructionPayees = [
    'Electricity Board Payment', 'Municipal Water Supply', 'Piped Gas Connection',
    'Broadband Internet – Airtel', 'Mobile Postpaid – Jio', 'DTH Recharge – Tata Play',
    'Housing Society Maintenance', 'SIP – HDFC Mutual Fund', 'SIP – ICICI Prudential MF',
];

const merchantMCCs = {
    'Swiggy Online Services': '5812', 'Zomato Food Delivery': '5812', 'Amazon Pay Merchant': '5411',
    'PhonePe Merchant': '6012', 'Google Pay Transfer': '6012', 'Paytm Wallet Load': '6012',
    'BigBasket Groceries': '5411', 'Dunzo Delivery': '5411', 'Uber India': '4121', 'Ola Cabs': '4121',
    'Flipkart Marketplace': '5311', 'DMart Ready': '5411', 'Apollo Pharmacy': '5912', 'BookMyShow': '7832',
    'MakeMyTrip': '4722', 'Zepto Quick Commerce': '5411', 'Blinkit Groceries': '5411', 'Cred Bill Pay': '6012',
    'Amazon India': '5311', 'Flipkart Online': '5311', 'Reliance Digital': '5732', 'Croma Electronics': '5732',
    'Shoppers Stop': '5311', 'Lifestyle International': '5311', 'Myntra Fashion': '5651',
    'Decathlon Sports': '5941', 'IKEA India': '5712', 'Nykaa Beauty': '5977', 'Tata CLiQ': '5311',
    'HP Petrol Pump': '5541', 'Indian Oil Station': '5541', 'BPCL Fuel Station': '5541',
    'PVR Cinemas': '7832', 'Starbucks India': '5814', 'Haldirams Restaurant': '5812',
    'Taj Hotels': '7011', 'Marriott Hotels': '7011', 'MakeMyTrip Flights': '4511',
    'Netflix Subscription': '4899', 'Amazon Prime Membership': '5968', 'Spotify Premium': '4899',
    'YouTube Premium': '4899', 'Hotstar VIP': '4899',
};

function enrichTxn(txn, opts = {}) {
    const date = new Date(txn.transactionDate);
    txn.productType = opts.productType || null;
    txn.initiationTimestamp = new Date(date.getTime() - random(0, 60000));
    txn.settlementTimestamp = new Date(date.getTime() + random(0, 300000));
    txn.balanceAfterTransaction = txn.balance;
    txn.currency = 'INR';
    txn.channel = opts.channel || pick(channels);
    txn.subCategory = opts.subCategory || null;
    txn.autoTagged = true;
    txn.merchantName = opts.merchantName || null;
    txn.merchantCity = opts.merchantCity || (opts.merchantName ? pick(merchantCities) : null);
    txn.merchantCategoryCode = opts.merchantName ? (merchantMCCs[opts.merchantName] || '0000') : null;
    txn.tags = opts.tags || [];
    txn.referenceNumber = txn.referenceId;
    txn.isReversal = false;
    txn.parentTransactionId = null;
    txn.status = opts.status || 'COMPLETED';
    return txn;
}

async function generateCustomers(count = 20) {
    const customers = [];
    const usedEmails = new Set();

    for (let i = 0; i < count; i++) {
        const firstName = pick(firstNames);
        const lastName = pick(lastNames);
        const name = `${firstName} ${lastName}`;
        let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@bankdemo.com`;
        while (usedEmails.has(email)) {
            email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}${random(10, 99)}@bankdemo.com`;
        }
        usedEmails.add(email);

        const profile = randomProfile();
        let annualIncome;
        let segment;
        switch (profile) {
            case 'FINANCIALLY_HEALTHY':
                annualIncome = random(1500000, 3000000);
                segment = pick(['AFFLUENT', 'HNI']);
                break;
            case 'MEDIUM_RISK':
                annualIncome = random(800000, 1500000);
                segment = pick(['MASS_AFFLUENT', 'AFFLUENT']);
                break;
            case 'HIGH_RISK':
                annualIncome = random(500000, 900000);
                segment = pick(['MASS', 'MASS_AFFLUENT']);
                break;
            case 'NEAR_DEFAULT':
                annualIncome = random(300000, 600000);
                segment = 'MASS';
                break;
            default:
                annualIncome = random(800000, 2000000);
                segment = 'MASS_AFFLUENT';
        }

        const cityIndex = random(0, cities.length);
        const city = cities[cityIndex];
        const state = states[cityIndex];
        const occupation = pick(occupations);
        const isFemale = ['Ananya', 'Diya', 'Ishita', 'Priya', 'Sneha', 'Kavya', 'Riya', 'Nisha', 'Meera', 'Tanvi'].includes(firstName);
        const gender = isFemale ? 'FEMALE' : 'MALE';
        const employmentType = occupation === 'Business Owner' ? 'SELF_EMPLOYED' : 'SALARIED';

        customers.push({
            customerId: 'HDF' + String(i + 1).padStart(4, '0'),
            name,
            email,
            phone: `+91${random(7000000000, 9999999999)}`,
            dateOfBirth: new Date(random(1970, 2000), random(0, 12), random(1, 28)),
            panNumber: `${String.fromCharCode(random(65, 91))}${String.fromCharCode(random(65, 91))}${String.fromCharCode(random(65, 91))}P${String.fromCharCode(random(65, 91))}${random(1000, 9999)}${String.fromCharCode(random(65, 91))}`,
            aadhaarMasked: `XXXX-XXXX-${random(1000, 9999)}`,
            gender,
            maritalStatus: pick(['SINGLE', 'MARRIED', 'MARRIED', 'MARRIED']),
            address: {
                line1: `${random(1, 500)}, ${pick(['MG Road', 'Park Street', 'Nehru Nagar', 'Gandhi Chowk', 'Lake View Apartments', 'Sector ' + random(1, 50)])}`,
                line2: pick(['Near Railway Station', 'Opposite Mall', 'Behind Temple', 'Main Market', null]),
                city,
                state,
                pincode: String(random(100000, 999999)),
                country: 'India',
            },
            occupation,
            employerName: employmentType === 'SALARIED' ? pick(employers) : null,
            employmentType,
            annualIncome,
            incomeSource: pick(incomeSources),
            netWorthEstimate: Math.round(annualIncome * randomFloat(2, 8)),
            creditScore: random(580, 850),
            onboardingDate: new Date(random(2018, 2024), random(0, 12), random(1, 28)),
            kycStatus: pick(['VERIFIED', 'VERIFIED', 'VERIFIED', 'PENDING']),
            segment,
            relationshipManagerId: 'RM' + random(1000, 9999),
            riskScore: 0,
            riskLevel: 'LOW',
            profileMetadata: {
                occupation,
                annualIncome,
                city,
                relationshipManagerId: 'RM' + random(1000, 9999),
            },
            _behaviorProfile: profile,
        });
    }

    const saved = await Customer.insertMany(customers);
    console.log(`  ✓ Created ${saved.length} customers`);
    return saved.map((c, idx) => ({ ...c.toObject(), _behaviorProfile: customers[idx]._behaviorProfile }));
}

async function generateProducts(customer) {
    const branch = pick(branches);
    const monthlyIncome = (customer.profileMetadata?.annualIncome || 1200000) / 12;

    const savings = await Product.create({
        productId: 'PRD' + Date.now() + random(1000, 9999),
        customerId: customer._id,
        productType: 'SAVINGS_ACCOUNT',
        productName: 'Primary Savings Account',
        productNumber: 'SB' + random(10000000, 99999999),
        status: 'ACTIVE',
        metadata: {
            accountType: 'Regular Savings',
            branchCode: branch.code,
            ifscCode: branch.ifsc,
            minimumBalance: 10000,
            interestRate: 3.5,
        },
    });

    const creditLimit = Math.round(monthlyIncome * random(2, 5));
    const last4 = String(random(1000, 9999));
    const creditCard = await Product.create({
        productId: 'PRD' + Date.now() + random(1000, 9999),
        customerId: customer._id,
        productType: 'CREDIT_CARD',
        productName: 'Visa Platinum Credit Card',
        productNumber: 'CC' + random(10000000, 99999999),
        status: 'ACTIVE',
        metadata: {
            cardVariant: pick(['Visa Platinum', 'Visa Signature', 'Mastercard Gold', 'RuPay Select']),
            last4Digits: last4,
            creditLimit,
            availableLimit: creditLimit,
            billingCycleStart: new Date('2026-01-01'),
            billingCycleEnd: new Date('2026-01-28'),
            paymentDueDate: new Date('2026-02-15'),
            interestRate: 3.49,
            rewardProgram: pick(['CashBack Rewards', 'Travel Miles', 'Super Points']),
            issueDate: new Date('2023-06-15'),
            expiryDate: new Date('2028-06-15'),
        },
    });

    const loanAmount = random(200000, 1000000);
    const loanTenure = pick([12, 24, 36, 48, 60]);
    const loanRate = randomFloat(10, 16);
    const emiAmount = Math.round((loanAmount * (loanRate / 1200) * Math.pow(1 + loanRate / 1200, loanTenure)) / (Math.pow(1 + loanRate / 1200, loanTenure) - 1));

    const loan = await Product.create({
        productId: 'PRD' + Date.now() + random(1000, 9999),
        customerId: customer._id,
        productType: 'LOAN',
        productName: 'Personal Loan',
        productNumber: 'LN' + random(10000000, 99999999),
        status: 'ACTIVE',
        metadata: {
            loanAmount,
            loanType: 'Personal Loan',
            interestRate: loanRate,
            emiAmount,
            emiDayOfMonth: 5,
            loanStartDate: new Date('2024-06-05'),
            loanEndDate: new Date(2024 + Math.ceil(loanTenure / 12), 5, 5),
            remainingTenureMonths: loanTenure - 6,
            foreclosureEligible: loanTenure > 12,
            foreclosureAmount: Math.round(loanAmount * 0.7),
            nextEmiDate: new Date('2026-02-05'),
            nextEmiAmount: emiAmount,
            totalOutstandingAmount: Math.round(loanAmount * 0.8),
        },
    });

    const fdAmount = random(100000, 500000);
    const fdRate = randomFloat(6.5, 7.5);
    const fdTenure = pick([12, 24, 36]);
    const fdMaturity = Math.round(fdAmount * Math.pow(1 + fdRate / 400, fdTenure / 3));

    const fd = await Product.create({
        productId: 'PRD' + Date.now() + random(1000, 9999),
        customerId: customer._id,
        productType: 'FD',
        productName: 'Fixed Deposit',
        productNumber: 'FD' + random(10000000, 99999999),
        status: 'ACTIVE',
        metadata: {
            depositAmount: fdAmount,
            interestRate: fdRate,
            startDate: new Date('2026-01-10'),
            maturityDate: new Date(2026 + Math.floor(fdTenure / 12), (fdTenure % 12), 10),
            maturityAmount: fdMaturity,
            autoRenewal: pick([true, false]),
            tenureMonths: fdTenure,
        },
    });

    const rdInstallment = pick([2000, 3000, 5000, 10000]);
    const rdTenure = pick([12, 24, 36]);
    const rdRate = randomFloat(6.0, 7.0);

    const rd = await Product.create({
        productId: 'PRD' + Date.now() + random(1000, 9999),
        customerId: customer._id,
        productType: 'RD',
        productName: 'Recurring Deposit',
        productNumber: 'RD' + random(10000000, 99999999),
        status: 'ACTIVE',
        metadata: {
            monthlyInstallment: rdInstallment,
            interestRate: rdRate,
            startDate: new Date('2026-01-15'),
            maturityDate: new Date(2026 + Math.floor(rdTenure / 12), (rdTenure % 12), 15),
            maturityAmount: Math.round(rdInstallment * rdTenure * (1 + rdRate / 200)),
            tenureMonths: rdTenure,
            paidInstallments: 0,
        },
    });

    return { savings, creditCard, loan, fd, rd };
}

function generateSavingsTransactions(product, customer, profile) {
    const txns = [];
    const customerId = customer._id;
    const productId = product._id;
    const monthlyIncome = (customer.profileMetadata?.annualIncome || 1200000) / 12;
    let balance;
    switch (profile) {
        case 'FINANCIALLY_HEALTHY': balance = Math.round(randomFloat(4, 8) * monthlyIncome); break;
        case 'MEDIUM_RISK': balance = Math.round(randomFloat(2, 4) * monthlyIncome); break;
        case 'HIGH_RISK': balance = Math.round(randomFloat(0.5, 1.5) * monthlyIncome); break;
        case 'NEAR_DEFAULT': balance = Math.round(randomFloat(0.15, 0.5) * monthlyIncome); break;
        default: balance = Math.round(randomFloat(1.5, 3) * monthlyIncome);
    }

    for (let month = 0; month < 12; month++) {
        const year = 2026;
        const m = month;
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        let txnCount = 0;

        const salaryAmount = Math.round(monthlyIncome + randomFloat(-2000, 2000));
        balance += salaryAmount;
        txns.push({
            transactionId: txnId(),
            customerId,
            productId,
            transactionDate: new Date(year, m, 1, 10, random(0, 59)),
            valueDate: new Date(year, m, 1),
            description: `NEFT Salary Credit – ${customer.profileMetadata?.occupation || 'Employer'} Pvt Ltd`,
            transactionType: 'CREDIT',
            amount: salaryAmount,
            balance,
            instrument: 'NEFT',
            transactionCategory: 'SALARY',
            referenceId: 'SAL' + year + String(m + 1).padStart(2, '0') + random(1000, 9999),
            remarks: 'Monthly salary credit',
        });
        txnCount++;

        const rentAmount = profile === 'FINANCIALLY_HEALTHY' ? random(15000, 25000) : random(10000, 20000);
        balance -= rentAmount;
        txns.push({
            transactionId: txnId(),
            customerId,
            productId,
            transactionDate: new Date(year, m, 5, 9, random(0, 59)),
            valueDate: new Date(year, m, 5),
            description: 'NEFT Transfer – Rent Payment to Landlord Account',
            transactionType: 'DEBIT',
            amount: rentAmount,
            balance,
            instrument: 'NEFT',
            transactionCategory: 'RENT',
            referenceId: 'RENT' + year + String(m + 1).padStart(2, '0'),
            remarks: 'Monthly rent payment',
        });
        txnCount++;

        const siCount = random(3, 6);
        for (let s = 0; s < siCount; s++) {
            const day = random(6, 15);
            const siAmount = random(500, 5000);
            balance -= siAmount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(6, 10), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: `Standing Instruction Debit – ${pick(standingInstructionPayees)}`,
                transactionType: 'DEBIT',
                amount: siAmount,
                balance,
                instrument: 'STANDING_INSTRUCTION',
                transactionCategory: 'UTILITIES',
                referenceId: 'SI' + random(100000, 999999),
            });
            txnCount++;
        }

        const atmCount = profile === 'FINANCIALLY_HEALTHY' ? random(2, 4) : random(4, 9);
        for (let a = 0; a < atmCount; a++) {
            const day = random(1, daysInMonth + 1);
            const atmAmount = pick([2000, 5000, 10000, 15000, 20000]);
            balance -= atmAmount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(8, 22), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: `ATM Cash Withdrawal – ${pick(atmBranches)}`,
                transactionType: 'DEBIT',
                amount: atmAmount,
                balance,
                instrument: 'ATM',
                transactionCategory: 'OTHER',
                referenceId: 'ATM' + random(100000, 999999),
            });
            txnCount++;
        }

        const upiTarget = random(75, 90);
        for (let u = 0; u < upiTarget; u++) {
            const day = random(1, daysInMonth + 1);
            const isCredit = Math.random() < 0.08;
            const amount = isCredit ? random(50, 2000) : random(20, 3000);
            balance += isCredit ? amount : -amount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(7, 23), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: isCredit
                    ? `UPI Credit – Refund from ${pick(upiMerchants)}`
                    : `UPI POS Transaction – ${pick(upiMerchants)}`,
                transactionType: isCredit ? 'CREDIT' : 'DEBIT',
                amount,
                balance,
                instrument: 'UPI',
                transactionCategory: pick(['FOOD', 'SHOPPING', 'TRANSFER', 'OTHER']),
                referenceId: 'UPI' + random(100000000, 999999999),
            });
            txnCount++;
        }

        const impsCount = random(10, 21);
        for (let i = 0; i < impsCount; i++) {
            const day = random(1, daysInMonth + 1);
            const isCredit = Math.random() < 0.3;
            const amount = random(1000, 50000);
            balance += isCredit ? amount : -amount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(9, 20), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: isCredit
                    ? `IMPS Credit – ${pick(impsBeneficiaries)}`
                    : `IMPS Transfer – ${pick(impsBeneficiaries)}`,
                transactionType: isCredit ? 'CREDIT' : 'DEBIT',
                amount,
                balance,
                instrument: 'IMPS',
                transactionCategory: 'TRANSFER',
                referenceId: 'IMPS' + random(100000000, 999999999),
            });
            txnCount++;
        }

        const neftCount = random(5, 11);
        for (let n = 0; n < neftCount; n++) {
            const day = random(1, daysInMonth + 1);
            const isCredit = Math.random() < 0.25;
            const amount = random(5000, 100000);
            balance += isCredit ? amount : -amount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(10, 17), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: isCredit
                    ? `NEFT Credit – ${pick(neftBeneficiaries)}`
                    : `NEFT Transfer – ${pick(neftBeneficiaries)}`,
                transactionType: isCredit ? 'CREDIT' : 'DEBIT',
                amount,
                balance,
                instrument: 'NEFT',
                transactionCategory: isCredit ? 'SALARY' : 'TRANSFER',
                referenceId: 'NEFT' + random(100000000, 999999999),
            });
            txnCount++;
        }

        const subCount = random(2, 5);
        for (let s = 0; s < subCount; s++) {
            const day = random(1, 15);
            const amount = random(149, 1499);
            balance -= amount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(0, 6), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: `Auto Debit – ${pick(subscriptionServices)}`,
                transactionType: 'DEBIT',
                amount,
                balance,
                instrument: 'AUTO_DEBIT',
                transactionCategory: 'UTILITIES',
                referenceId: 'AD' + random(100000, 999999),
            });
            txnCount++;
        }

        const ccBillAmount = random(10000, 60000);
        balance -= ccBillAmount;
        txns.push({
            transactionId: txnId(),
            customerId,
            productId,
            transactionDate: new Date(year, m, random(14, 20), 11, random(0, 59)),
            valueDate: new Date(year, m, random(14, 20)),
            description: 'Bank Internal Transfer – Credit Card Bill Payment',
            transactionType: 'DEBIT',
            amount: ccBillAmount,
            balance,
            instrument: 'BANK_INTERNAL_TRANSFER',
            transactionCategory: 'TRANSFER',
            referenceId: 'CCPAY' + random(100000, 999999),
            remarks: 'Credit card statement payment',
        });
        txnCount++;

        const chequeCount = random(1, 4);
        for (let c = 0; c < chequeCount; c++) {
            const day = random(10, 25);
            const isCredit = Math.random() < 0.3;
            const amount = random(5000, 50000);
            balance += isCredit ? amount : -amount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(10, 16), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day + 1, daysInMonth)),
                description: isCredit
                    ? `Cheque Deposit Credit – CHQ No ${random(100000, 999999)}`
                    : `Cheque Issued Debit – CHQ No ${random(100000, 999999)}`,
                transactionType: isCredit ? 'CREDIT' : 'DEBIT',
                amount,
                balance,
                instrument: 'CHEQUE',
                transactionCategory: 'OTHER',
                referenceId: 'CHQ' + random(100000, 999999),
            });
            txnCount++;
        }

        const rtgsCount = random(0, 3);
        for (let r = 0; r < rtgsCount; r++) {
            const day = random(1, daysInMonth + 1);
            const isCredit = Math.random() < 0.4;
            const amount = random(200000, 1000000);
            balance += isCredit ? amount : -amount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(10, 15), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: isCredit
                    ? `RTGS Credit – High Value Transfer Received`
                    : `RTGS Transfer – High Value Payment`,
                transactionType: isCredit ? 'CREDIT' : 'DEBIT',
                amount,
                balance,
                instrument: 'RTGS',
                transactionCategory: 'TRANSFER',
                referenceId: 'RTGS' + random(100000000, 999999999),
            });
            txnCount++;
        }

        const interestAmount = Math.round(balance * 0.035 / 12);
        if (interestAmount > 0) {
            balance += interestAmount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, daysInMonth, 23, 59),
                valueDate: new Date(year, m, daysInMonth),
                description: 'Interest Credit – Savings Account Quarterly Interest',
                transactionType: 'CREDIT',
                amount: interestAmount,
                balance,
                instrument: 'INTEREST_CREDIT',
                transactionCategory: 'OTHER',
                referenceId: 'INT' + random(100000, 999999),
            });
            txnCount++;
        }

        const remaining = Math.max(0, 200 - txnCount);
        for (let f = 0; f < remaining; f++) {
            const day = random(1, daysInMonth + 1);
            const isCredit = Math.random() < 0.15;
            const inst = Math.random() < 0.6 ? 'UPI' : 'IMPS';
            const amount = inst === 'UPI' ? random(10, 1500) : random(500, 10000);
            balance += isCredit ? amount : -amount;
            const merchant = inst === 'UPI' ? pick(upiMerchants) : pick(impsBeneficiaries);
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(7, 23), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: isCredit
                    ? `${inst} Credit – ${merchant}`
                    : `${inst} ${inst === 'UPI' ? 'POS Transaction' : 'Transfer'} – ${merchant}`,
                transactionType: isCredit ? 'CREDIT' : 'DEBIT',
                amount,
                balance,
                instrument: inst,
                transactionCategory: pick(['FOOD', 'SHOPPING', 'TRANSFER', 'OTHER']),
                referenceId: inst + random(100000000, 999999999),
            });
        }

        if (profile === 'HIGH_RISK' || profile === 'NEAR_DEFAULT') {
            if (Math.random() < 0.4) {
                const spike = random(20000, 80000);
                balance -= spike;
                txns.push({
                    transactionId: txnId(),
                    customerId,
                    productId,
                    transactionDate: new Date(year, m, random(20, Math.min(28, daysInMonth)), 14, random(0, 59)),
                    valueDate: new Date(year, m, random(20, Math.min(28, daysInMonth))),
                    description: 'NEFT Transfer – Urgent Payment / Emergency Expense',
                    transactionType: 'DEBIT',
                    amount: spike,
                    balance,
                    instrument: 'NEFT',
                    transactionCategory: 'OTHER',
                    referenceId: 'EMG' + random(100000, 999999),
                    remarks: 'Emergency / unplanned large expense',
                });
            }
        }

        if (profile === 'NEAR_DEFAULT' && Math.random() < 0.3) {
            const penalty = random(500, 2000);
            balance -= penalty;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, daysInMonth, 23, 30),
                valueDate: new Date(year, m, daysInMonth),
                description: 'Bank Charge – Minimum Balance Non-Maintenance Penalty',
                transactionType: 'DEBIT',
                amount: penalty,
                balance,
                instrument: 'BANK_INTERNAL_TRANSFER',
                transactionCategory: 'OTHER',
                referenceId: 'PEN' + random(100000, 999999),
                remarks: 'Minimum balance penalty',
            });
        }
    }

    return txns.map((t) => enrichTxn(t, {
        productType: 'SAVINGS_ACCOUNT',
        channel: t.instrument === 'UPI' ? 'MOBILE_APP' : t.instrument === 'ATM' ? 'ATM' : t.instrument === 'NEFT' || t.instrument === 'IMPS' ? pick(['INTERNET_BANKING', 'MOBILE_APP']) : pick(channels),
        merchantName: (t.description || '').includes('–') ? (t.description || '').split('–').pop().trim().split(' ').slice(0, 3).join(' ') : null,
    }));
}

function generateCreditCardTransactions(product, customer, profile) {
    const txns = [];
    const customerId = customer._id;
    const productId = product._id;
    const creditLimit = product.metadata?.creditLimit || 200000;
    let outstanding = 0;

    for (let month = 0; month < 12; month++) {
        const year = 2026;
        const m = month;
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        let txnCount = 0;

        const shoppingCount = random(30, 51);
        for (let s = 0; s < shoppingCount; s++) {
            const day = random(1, daysInMonth + 1);
            const amount = random(200, 15000);
            outstanding += amount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(9, 22), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: `Credit Card POS Transaction – ${pick(cardMerchants)}`,
                transactionType: 'DEBIT',
                amount,
                balance: Math.max(0, creditLimit - outstanding),
                instrument: 'CARD',
                transactionCategory: pick(['SHOPPING', 'FOOD', 'OTHER']),
                referenceId: 'CC' + random(100000000, 999999999),
            });
            txnCount++;
        }

        const subCount = random(2, 6);
        for (let s = 0; s < subCount; s++) {
            const day = random(1, 10);
            const amount = random(99, 1499);
            outstanding += amount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(0, 6), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: `Card Auto Debit – ${pick(subscriptionServices)}`,
                transactionType: 'DEBIT',
                amount,
                balance: Math.max(0, creditLimit - outstanding),
                instrument: 'CARD',
                transactionCategory: 'UTILITIES',
                referenceId: 'CCSUB' + random(100000, 999999),
            });
            txnCount++;
        }

        const fuelCount = random(3, 7);
        for (let f = 0; f < fuelCount; f++) {
            const day = random(1, daysInMonth + 1);
            const amount = random(1500, 5000);
            outstanding += amount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(7, 20), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: `Credit Card POS Transaction – ${pick(['HP Petrol Pump', 'Indian Oil Station', 'BPCL Fuel Station'])}`,
                transactionType: 'DEBIT',
                amount,
                balance: Math.max(0, creditLimit - outstanding),
                instrument: 'CARD',
                transactionCategory: 'OTHER',
                referenceId: 'CCFUEL' + random(100000, 999999),
            });
            txnCount++;
        }

        const foodCount = random(15, 31);
        for (let f = 0; f < foodCount; f++) {
            const day = random(1, daysInMonth + 1);
            const amount = random(100, 3000);
            outstanding += amount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(11, 23), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: `Credit Card POS Transaction – ${pick(['Swiggy Online Services', 'Zomato Food Delivery', 'Starbucks India', 'Haldirams Restaurant', 'Dominos Pizza', 'KFC India', 'McDonalds India'])}`,
                transactionType: 'DEBIT',
                amount,
                balance: Math.max(0, creditLimit - outstanding),
                instrument: 'CARD',
                transactionCategory: 'FOOD',
                referenceId: 'CCFOOD' + random(100000, 999999),
            });
            txnCount++;
        }

        const travelCount = random(0, 3);
        for (let t = 0; t < travelCount; t++) {
            const day = random(1, daysInMonth + 1);
            const amount = random(3000, 30000);
            outstanding += amount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(10, 18), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: `Credit Card POS Transaction – ${pick(['MakeMyTrip Flights', 'Taj Hotels', 'Marriott Hotels', 'IRCTC Rail Booking', 'Uber India'])}`,
                transactionType: 'DEBIT',
                amount,
                balance: Math.max(0, creditLimit - outstanding),
                instrument: 'CARD',
                transactionCategory: 'OTHER',
                referenceId: 'CCTRV' + random(100000, 999999),
            });
            txnCount++;
        }

        let paymentAmount;
        switch (profile) {
            case 'FINANCIALLY_HEALTHY':
                paymentAmount = outstanding;
                break;
            case 'MEDIUM_RISK':
                paymentAmount = Math.round(outstanding * randomFloat(0.7, 0.95));
                break;
            case 'HIGH_RISK':
                paymentAmount = Math.round(outstanding * randomFloat(0.3, 0.6));
                break;
            case 'NEAR_DEFAULT':
                paymentAmount = Math.random() < 0.4 ? 0 : Math.round(outstanding * randomFloat(0.1, 0.3));
                break;
            default:
                paymentAmount = outstanding;
        }

        if (paymentAmount > 0) {
            outstanding -= paymentAmount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, random(15, 22), 12, random(0, 59)),
                valueDate: new Date(year, m, random(15, 22)),
                description: 'Credit Card Bill Payment – Online Banking Transfer',
                transactionType: 'CREDIT',
                amount: paymentAmount,
                balance: Math.max(0, creditLimit - outstanding),
                instrument: 'BANK_INTERNAL_TRANSFER',
                transactionCategory: 'TRANSFER',
                referenceId: 'CCPAY' + random(100000, 999999),
                remarks: profile === 'FINANCIALLY_HEALTHY' ? 'Full statement payment' : 'Partial payment',
            });
            txnCount++;
        }

        let addLateFee = false;
        if (profile === 'MEDIUM_RISK' && Math.random() < 0.2) addLateFee = true;
        if (profile === 'HIGH_RISK' && Math.random() < 0.5) addLateFee = true;
        if (profile === 'NEAR_DEFAULT' && Math.random() < 0.7) addLateFee = true;

        if (addLateFee) {
            const fee = pick([500, 750, 1000, 1200]);
            outstanding += fee;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(25, daysInMonth), 0, 1),
                valueDate: new Date(year, m, Math.min(25, daysInMonth)),
                description: 'Late Payment Fee – Credit Card Statement',
                transactionType: 'DEBIT',
                amount: fee,
                balance: Math.max(0, creditLimit - outstanding),
                instrument: 'BANK_INTERNAL_TRANSFER',
                transactionCategory: 'OTHER',
                referenceId: 'LTFEE' + random(100000, 999999),
                remarks: 'Late payment penalty charge',
            });
            txnCount++;
        }

        if (outstanding > 0 && profile !== 'FINANCIALLY_HEALTHY') {
            const interest = Math.round(outstanding * 0.0349 / 12);
            if (interest > 0) {
                outstanding += interest;
                txns.push({
                    transactionId: txnId(),
                    customerId,
                    productId,
                    transactionDate: new Date(year, m, Math.min(28, daysInMonth), 23, 55),
                    valueDate: new Date(year, m, Math.min(28, daysInMonth)),
                    description: 'Finance Charge – Revolving Credit Interest',
                    transactionType: 'DEBIT',
                    amount: interest,
                    balance: Math.max(0, creditLimit - outstanding),
                    instrument: 'BANK_INTERNAL_TRANSFER',
                    transactionCategory: 'OTHER',
                    referenceId: 'CCINT' + random(100000, 999999),
                });
                txnCount++;
            }
        }

        const refundCount = random(1, 4);
        for (let r = 0; r < refundCount; r++) {
            const day = random(5, 25);
            const amount = random(200, 5000);
            outstanding = Math.max(0, outstanding - amount);
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(10, 18), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: `Credit Card Refund – ${pick(cardMerchants)} Return/Cancellation`,
                transactionType: 'CREDIT',
                amount,
                balance: Math.max(0, creditLimit - outstanding),
                instrument: 'CARD',
                transactionCategory: 'SHOPPING',
                referenceId: 'CCREF' + random(100000, 999999),
                remarks: 'Merchant refund processed',
            });
            txnCount++;
        }

        const remaining = Math.max(0, 200 - txnCount);
        for (let f = 0; f < remaining; f++) {
            const day = random(1, daysInMonth + 1);
            const amount = random(50, 5000);
            outstanding += amount;
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(day, daysInMonth), random(8, 22), random(0, 59)),
                valueDate: new Date(year, m, Math.min(day, daysInMonth)),
                description: `Credit Card POS Transaction – ${pick(cardMerchants)}`,
                transactionType: 'DEBIT',
                amount,
                balance: Math.max(0, creditLimit - outstanding),
                instrument: 'CARD',
                transactionCategory: pick(['SHOPPING', 'FOOD', 'OTHER']),
                referenceId: 'CC' + random(100000000, 999999999),
            });
        }
    }

    return txns.map((t) => enrichTxn(t, {
        productType: 'CREDIT_CARD',
        channel: t.instrument === 'CARD' ? 'POS' : t.instrument === 'BANK_INTERNAL_TRANSFER' ? 'INTERNET_BANKING' : pick(channels),
        merchantName: (t.description || '').includes('–') ? (t.description || '').split('–').pop().trim().split(' ').slice(0, 3).join(' ') : null,
        subCategory: t.transactionCategory === 'FOOD' ? pick(['Dining', 'Delivery', 'Cafe']) : t.transactionCategory === 'SHOPPING' ? pick(['Electronics', 'Fashion', 'Groceries']) : null,
        tags: t.transactionCategory === 'FOOD' ? ['food'] : t.transactionCategory === 'SHOPPING' ? ['shopping'] : [],
    }));
}

function generateLoanTransactions(product, customer, profile) {
    const txns = [];
    const customerId = customer._id;
    const productId = product._id;
    const emiAmount = product.metadata?.emiAmount || 15000;
    let outstanding = product.metadata?.loanAmount || 500000;

    txns.push({
        transactionId: txnId(),
        customerId,
        productId,
        transactionDate: new Date(2026, 0, 2, 10, 30),
        valueDate: new Date(2026, 0, 2),
        description: 'Loan Disbursement – Personal Loan Account Credit',
        transactionType: 'CREDIT',
        amount: outstanding,
        balance: outstanding,
        instrument: 'LOAN_DISBURSEMENT',
        transactionCategory: 'LOAN',
        referenceId: 'LNDIS' + random(100000, 999999),
        remarks: 'Personal loan disbursement',
    });

    for (let month = 0; month < 12; month++) {
        const year = 2026;
        const m = month;
        const emiDay = product.metadata?.emiDayOfMonth || 5;

        let missedEmi = false;
        if (profile === 'NEAR_DEFAULT' && Math.random() < 0.25) missedEmi = true;
        if (profile === 'HIGH_RISK' && Math.random() < 0.1) missedEmi = true;

        if (!missedEmi) {
            outstanding = Math.max(0, outstanding - emiAmount);
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, emiDay, 6, 0),
                valueDate: new Date(year, m, emiDay),
                description: 'Loan EMI Auto Debit – Personal Loan Account',
                transactionType: 'DEBIT',
                amount: emiAmount,
                balance: outstanding,
                instrument: 'EMI_PAYMENT',
                transactionCategory: 'LOAN',
                referenceId: 'EMI' + year + String(m + 1).padStart(2, '0'),
                remarks: `EMI ${m + 1} of tenure`,
            });
        } else {
            const penalty = random(500, 2000);
            txns.push({
                transactionId: txnId(),
                customerId,
                productId,
                transactionDate: new Date(year, m, Math.min(emiDay + 15, 28), 10, 0),
                valueDate: new Date(year, m, Math.min(emiDay + 15, 28)),
                description: 'Penalty Charge – Missed EMI Payment – Personal Loan',
                transactionType: 'DEBIT',
                amount: penalty,
                balance: outstanding + penalty,
                instrument: 'BANK_INTERNAL_TRANSFER',
                transactionCategory: 'LOAN',
                referenceId: 'EMIPEN' + year + String(m + 1).padStart(2, '0'),
                remarks: 'EMI bounce / missed payment penalty',
            });
            outstanding += penalty;
        }


    }

    return txns.map((t) => enrichTxn(t, {
        productType: 'LOAN',
        channel: 'INTERNET_BANKING',
        tags: ['loan', 'emi'],
    }));
}

function generateFDTransactions(product, customer) {
    const txns = [];
    const customerId = customer._id;
    const productId = product._id;
    const depositAmount = product.metadata?.depositAmount || 200000;
    const interestRate = product.metadata?.interestRate || 7.0;
    const quarterlyInterest = Math.round(depositAmount * interestRate / 400);

    txns.push({
        transactionId: txnId(),
        customerId,
        productId,
        transactionDate: new Date(2026, 0, 10, 10, 0),
        valueDate: new Date(2026, 0, 10),
        description: 'Fixed Deposit Booking – New FD Created',
        transactionType: 'DEBIT',
        amount: depositAmount,
        balance: depositAmount,
        instrument: 'FD_BOOKING',
        transactionCategory: 'INVESTMENT',
        referenceId: 'FDB' + random(100000, 999999),
        remarks: `FD booked at ${interestRate}% for ${product.metadata?.tenureMonths || 12} months`,
    });

    const interestMonths = [2, 5, 8, 11];
    for (const m of interestMonths) {
        const daysInMonth = new Date(2026, m + 1, 0).getDate();
        txns.push({
            transactionId: txnId(),
            customerId,
            productId,
            transactionDate: new Date(2026, m, daysInMonth, 23, 59),
            valueDate: new Date(2026, m, daysInMonth),
            description: 'Quarterly Interest Credit – Fixed Deposit',
            transactionType: 'CREDIT',
            amount: quarterlyInterest,
            balance: depositAmount,
            instrument: 'INTEREST_CREDIT',
            transactionCategory: 'INVESTMENT',
            referenceId: 'FDINT' + random(100000, 999999),
            remarks: `Q${interestMonths.indexOf(m) + 1} interest @ ${interestRate}% p.a.`,
        });
    }

    const maturityDate = product.metadata?.maturityDate;
    if (maturityDate && new Date(maturityDate) <= END_DATE) {
        txns.push({
            transactionId: txnId(),
            customerId,
            productId,
            transactionDate: new Date(maturityDate),
            valueDate: new Date(maturityDate),
            description: 'Fixed Deposit Maturity – Principal + Interest Credited',
            transactionType: 'CREDIT',
            amount: product.metadata?.maturityAmount || depositAmount,
            balance: 0,
            instrument: 'FD_MATURITY',
            transactionCategory: 'INVESTMENT',
            referenceId: 'FDM' + random(100000, 999999),
            remarks: 'FD matured – amount credited to savings',
        });
    }

    return txns.map((t) => enrichTxn(t, {
        productType: 'FD',
        channel: 'INTERNET_BANKING',
        tags: ['investment', 'fd'],
    }));
}

function generateRDTransactions(product, customer) {
    const txns = [];
    const customerId = customer._id;
    const productId = product._id;
    const installment = product.metadata?.monthlyInstallment || 5000;

    for (let month = 0; month < 12; month++) {
        txns.push({
            transactionId: txnId(),
            customerId,
            productId,
            transactionDate: new Date(2026, month, 15, 6, 0),
            valueDate: new Date(2026, month, 15),
            description: 'Recurring Deposit Installment Debit',
            transactionType: 'DEBIT',
            amount: installment,
            balance: installment * (month + 1),
            instrument: 'RD_INSTALLMENT',
            transactionCategory: 'INVESTMENT',
            referenceId: 'RDI' + 2026 + String(month + 1).padStart(2, '0'),
            remarks: `RD installment ${month + 1}`,
        });
    }

    const rdRate = product.metadata?.interestRate || 6.5;
    const halfYearlyInterest = Math.round(installment * 6 * rdRate / 200);

    txns.push({
        transactionId: txnId(),
        customerId,
        productId,
        transactionDate: new Date(2026, 5, 30, 23, 59),
        valueDate: new Date(2026, 5, 30),
        description: 'Interest Credit – Recurring Deposit Half-Yearly',
        transactionType: 'CREDIT',
        amount: halfYearlyInterest,
        balance: installment * 6 + halfYearlyInterest,
        instrument: 'INTEREST_CREDIT',
        transactionCategory: 'INVESTMENT',
        referenceId: 'RDINT' + random(100000, 999999),
        remarks: `H1 interest @ ${rdRate}% p.a.`,
    });

    txns.push({
        transactionId: txnId(),
        customerId,
        productId,
        transactionDate: new Date(2026, 11, 31, 23, 59),
        valueDate: new Date(2026, 11, 31),
        description: 'Interest Credit – Recurring Deposit Half-Yearly',
        transactionType: 'CREDIT',
        amount: halfYearlyInterest,
        balance: installment * 12 + halfYearlyInterest * 2,
        instrument: 'INTEREST_CREDIT',
        transactionCategory: 'INVESTMENT',
        referenceId: 'RDINT' + random(100000, 999999),
        remarks: `H2 interest @ ${rdRate}% p.a.`,
    });

    return txns.map((t) => enrichTxn(t, {
        productType: 'RD',
        channel: 'INTERNET_BANKING',
        tags: ['investment', 'rd'],
    }));
}

async function insertTransactionsBatch(transactions) {
    const BATCH_SIZE = 1000;
    let inserted = 0;
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
        const batch = transactions.slice(i, i + BATCH_SIZE);
        await Transaction.insertMany(batch, { ordered: false });
        inserted += batch.length;
    }
    return inserted;
}

async function generateAllMockData(customerCount = 20) {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║      Banking Mock Data Generator – Starting...         ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`  Target: ${customerCount} customers, 5 products each, ~4800+ txns each\n`);

    console.log('[1/3] Generating customers...');
    const customers = await generateCustomers(customerCount);

    let totalProducts = 0;
    let totalTransactions = 0;

    for (let idx = 0; idx < customers.length; idx++) {
        const customer = customers[idx];
        const profile = customer._behaviorProfile;
        console.log(`\n[2/3] Customer ${idx + 1}/${customers.length}: ${customer.name} (${profile})`);

        const products = await generateProducts(customer);
        totalProducts += 5;
        console.log('  ✓ 5 products created');

        const allTxns = [];

        const savingsTxns = generateSavingsTransactions(products.savings, customer, profile);
        allTxns.push(...savingsTxns);
        console.log(`  ✓ Savings: ${savingsTxns.length} transactions`);

        const ccTxns = generateCreditCardTransactions(products.creditCard, customer, profile);
        allTxns.push(...ccTxns);
        console.log(`  ✓ Credit Card: ${ccTxns.length} transactions`);

        const loanTxns = generateLoanTransactions(products.loan, customer, profile);
        allTxns.push(...loanTxns);
        console.log(`  ✓ Loan: ${loanTxns.length} transactions`);

        const fdTxns = generateFDTransactions(products.fd, customer);
        allTxns.push(...fdTxns);
        console.log(`  ✓ FD: ${fdTxns.length} transactions`);

        const rdTxns = generateRDTransactions(products.rd, customer);
        allTxns.push(...rdTxns);
        console.log(`  ✓ RD: ${rdTxns.length} transactions`);

        const inserted = await insertTransactionsBatch(allTxns);
        totalTransactions += inserted;
        console.log(`  ✓ Total inserted: ${inserted} transactions`);
    }

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║              Generation Complete!                       ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`  Customers:    ${customers.length}`);
    console.log(`  Products:     ${totalProducts}`);
    console.log(`  Transactions: ${totalTransactions}`);
    console.log('');

    return { customers: customers.length, products: totalProducts, transactions: totalTransactions };
}

async function runSeeder() {
    try {
        console.log('Starting banking mock data generation...\n');

        await connectDB();
        console.log('Clearing existing data...');
        await Promise.all([
            Customer.deleteMany({}),
            Product.deleteMany({}),
            Transaction.deleteMany({}),
            RiskScore.deleteMany({}),
            Calls.deleteMany({}),
        ]);
        console.log('  ✓ Collections cleared\n');

        const result = await generateAllMockData(5);

        console.log('Mock data generation completed successfully!');
        console.log(`Summary: ${result.customers} customers, ${result.products} products, ${result.transactions} transactions`);

        await disconnectDB();
        process.exit(0);
    } catch (error) {
        console.error('Mock data generation failed:', error);
        await disconnectDB();
        process.exit(1);
    }
}

runSeeder();