# 🏢 Clarinet Payroll Smart Contract

A comprehensive decentralized salary disbursement system built on the Stacks blockchain using the Clarinet programming language. This smart contract enables automated payroll management, employee registration, and transparent salary payments in a trustless environment.

## 🌟 Features

- **Employee Management**: Add, update, and deactivate employees
- **Flexible Pay Frequencies**: Support for weekly, biweekly, and monthly payments
- **Automated Calculations**: Built-in salary and overtime calculations
- **Treasury Management**: Secure funding and balance tracking
- **Payment History**: Complete audit trail of all transactions
- **Scheduled Payroll**: Automated payroll execution based on schedules
- **Bonus & Deductions**: Support for performance bonuses and deductions
- **Multi-Department**: Department-based employee organization

## 🛠️ Technology Stack

- **Smart Contract**: Clarinet (Stacks blockchain)
- **Testing**: Vitest with custom mock framework
- **Blockchain**: Stacks (Bitcoin layer-2)
- **Language**: Clarity smart contract language

## 📋 Prerequisites

- [Clarinet CLI](https://github.com/hirosystems/clarinet) installed
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://npmjs.com/) or [yarn](https://yarnpkg.com/)
- Stacks wallet for deployment

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/clarinet-payroll-contract.git
cd clarinet-payroll-contract
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Initialize Clarinet Project

```bash
clarinet new payroll-system
cd payroll-system
```

### 4. Add the Contract

Copy the `payroll-contract.clar` file to the `contracts/` directory:

```bash
cp ../payroll-contract.clar contracts/
```

### 5. Run Tests

```bash
# Run Vitest unit tests
npm test

# Run Clarinet integration tests
clarinet test
```

### 6. Deploy Locally

```bash
clarinet console
```

## 📖 Contract Functions

### Public Functions

#### Employee Management

- `clarinet-add-employee` - Register a new employee
- `clarinet-update-salary` - Update employee salary
- `clarinet-deactivate-employee` - Deactivate an employee

#### Payment Processing

- `clarinet-process-payment` - Process individual salary payment
- `clarinet-process-department-payroll` - Process payroll for entire department
- `clarinet-fund-treasury` - Add funds to company treasury

#### Scheduling

- `clarinet-create-schedule` - Create automated payroll schedule
- `clarinet-execute-schedule` - Execute scheduled payroll
- `clarinet-set-bonus` - Set employee bonus

### Read-Only Functions

- `clarinet-get-employee` - Get employee details
- `clarinet-get-payment-history` - Get payment records
- `clarinet-get-treasury-balance` - Check company balance
- `clarinet-get-next-payment` - Calculate next payment amount
- `clarinet-is-payment-due` - Check if payment is due
- `clarinet-get-employee-count` - Get total employee count

## 🔧 Usage Examples

### Adding an Employee

```clarity
;; Add a software engineer with $100k annual salary, paid biweekly
(contract-call? .payroll-contract clarinet-add-employee
  'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
  u100000
  "Software Engineer"
  "Engineering"
  "biweekly"
)
```

### Funding Treasury

```clarity
;; Add $500k to company treasury
(contract-call? .payroll-contract clarinet-fund-treasury u500000)
```

### Processing Payment

```clarity
;; Process payment for employee #1 with $1000 bonus and $500 deductions
(contract-call? .payroll-contract clarinet-process-payment u1 u1000 u500)
```

### Checking Payment Status

```clarity
;; Check if employee #1 is due for payment
(contract-call? .payroll-contract clarinet-is-payment-due u1)

;; Get next payment amount for employee #1
(contract-call? .payroll-contract clarinet-get-next-payment u1)
```

## 🧪 Testing

The project includes comprehensive test coverage using Vitest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Categories

- **Employee Management Tests**: Adding, updating, deactivating employees
- **Treasury Management Tests**: Funding and balance operations
- **Payment Processing Tests**: Salary calculations and payments
- **Authorization Tests**: Access control and security
- **Edge Case Tests**: Boundary conditions and error handling

## 📁 Project Structure

```
clarinet-payroll-contract/
├── contracts/
│   └── payroll-contract.clar      # Main smart contract
├── tests/
│   ├── payroll-contract.test.ts   # Vitest unit tests
│   └── integration.test.ts        # Integration tests
├── settings/
│   └── Devnet.toml               # Network configuration
├── package.json                   # Dependencies
├── clarinet.toml                 # Clarinet configuration
└── README.md                     # This file
```

## 🔐 Security Features

- **Owner-only Functions**: Critical functions restricted to contract owner
- **Input Validation**: Comprehensive parameter validation
- **Balance Checks**: Prevents overspending from treasury
- **Employee Status**: Prevents payments to inactive employees
- **Audit Trail**: Complete payment history tracking

## 🚨 Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 100  | ERR_UNAUTHORIZED | Caller lacks required permissions |
| 101  | ERR_EMPLOYEE_NOT_FOUND | Employee ID doesn't exist |
| 102  | ERR_INSUFFICIENT_FUNDS | Treasury balance too low |
| 103  | ERR_INVALID_AMOUNT | Invalid salary or payment amount |
| 104  | ERR_ALREADY_PAID | Payment already processed |
| 105  | ERR_INVALID_FREQUENCY | Unsupported pay frequency |

## 🌐 Deployment

### Testnet Deployment

```bash
# Deploy to Stacks testnet
clarinet deployments generate --testnet
clarinet deployments apply --testnet
```

### Mainnet Deployment

```bash
# Deploy to Stacks mainnet (use with caution)
clarinet deployments generate --mainnet
clarinet deployments apply --mainnet
```

### Environment Variables

Create a `.env` file for deployment configuration:

```env
STACKS_PRIVATE_KEY=your_private_key_here
STACKS_NETWORK=testnet  # or mainnet
CONTRACT_NAME=payroll-contract
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Add tests** for new functionality
5. **Ensure tests pass**: `npm test`
6. **Commit changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Create Pull Request**

### Development Guidelines

- Follow Clarity best practices
- Maintain test coverage above 90%
- Use descriptive function and variable names
- Add comprehensive error handling
- Update documentation for new features

## 📊 Gas Optimization

The contract is optimized for minimal gas usage:

- Efficient data structures using maps
- Batched operations where possible
- Minimal storage operations
- Optimized calculation functions

## 🛡️ Audit Status

- ✅ Unit tested (90%+ coverage)
- ✅ Integration tested
- ⚠️ Security audit pending
- ⚠️ Mainnet deployment pending

## 📚 Documentation

- [Clarinet Documentation](https://docs.hiro.so/clarinet/)
- [Stacks Blockchain](https://docs.stacks.co/)
- [Clarity Language Reference](https://docs.stacks.co/clarity/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Stacks Foundation for blockchain infrastructure
- Hiro Systems for Clarinet development tools
- Community contributors and testers

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/clarinet-payroll-contract/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/clarinet-payroll-contract/discussions)
- **Email**: your.email@example.com

## 🗺️ Roadmap

- [ ] **v1.1**: Multi-signature support for large payments
- [ ] **v1.2**: Integration with time tracking systems
- [ ] **v1.3**: Advanced reporting and analytics
- [ ] **v1.4**: Mobile app for employee self-service