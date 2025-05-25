import { describe, expect, it, beforeEach } from "vitest";

// Mock Clarinet testing environment
class MockClarinet {
  private contracts = new Map();
  private accounts = new Map();
  private blockHeight = 1;

  constructor() {
    // Initialize mock accounts
    this.accounts.set('deployer', { address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' });
    this.accounts.set('wallet_1', { address: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5' });
    this.accounts.set('wallet_2', { address: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' });
  }

  deploy(contractName: string, contractCode: string, deployer: string) {
    this.contracts.set(contractName, {
      code: contractCode,
      deployer: deployer,
      storage: new Map(),
      constants: {
        CONTRACT_OWNER: this.accounts.get(deployer)?.address,
        ERR_UNAUTHORIZED: 100,
        ERR_EMPLOYEE_NOT_FOUND: 101,
        ERR_INSUFFICIENT_FUNDS: 102,
        ERR_INVALID_AMOUNT: 103,
        ERR_ALREADY_PAID: 104,
        ERR_INVALID_FREQUENCY: 105
      },
      variables: {
        'company-balance': 0,
        'next-employee-id': 1,
        'next-payment-id': 1,
        'next-schedule-id': 1
      },
      maps: {
        employees: new Map(),
        'payment-history': new Map(),
        'payroll-schedules': new Map()
      }
    });
  }

  call(contractName: string, functionName: string, args: any[], sender: string) {
    const contract = this.contracts.get(contractName);
    if (!contract) throw new Error(`Contract ${contractName} not found`);

    const senderAddress = this.accounts.get(sender)?.address || sender;
    
    switch (functionName) {
      case 'clarinet-add-employee':
        return this.addEmployee(contract, args, senderAddress);
      case 'clarinet-process-payment':
        return this.processPayment(contract, args, senderAddress);
      case 'clarinet-fund-treasury':
        return this.fundTreasury(contract, args, senderAddress);
      case 'clarinet-update-salary':
        return this.updateSalary(contract, args, senderAddress);
      case 'clarinet-deactivate-employee':
        return this.deactivateEmployee(contract, args, senderAddress);
      case 'clarinet-get-employee':
        return this.getEmployee(contract, args);
      case 'clarinet-get-treasury-balance':
        return this.getTreasuryBalance(contract);
      case 'clarinet-get-next-payment':
        return this.getNextPayment(contract, args);
      case 'clarinet-is-payment-due':
        return this.isPaymentDue(contract, args);
      case 'clarinet-get-employee-count':
        return this.getEmployeeCount(contract);
      default:
        throw new Error(`Function ${functionName} not implemented`);
    }
  }

  private addEmployee(contract: any, args: any[], sender: string) {
    if (sender !== contract.constants.CONTRACT_OWNER) {
      return { type: 'error', value: contract.constants.ERR_UNAUTHORIZED };
    }

    const [wallet, annualSalary, role, department, payFrequency] = args;
    
    if (annualSalary <= 0) {
      return { type: 'error', value: contract.constants.ERR_INVALID_AMOUNT };
    }

    const employeeId = contract.variables['next-employee-id'];
    const hourlyRate = Math.floor(annualSalary / 2080);

    contract.maps.employees.set(employeeId, {
      'wallet-address': wallet,
      'annual-salary': annualSalary,
      'hourly-rate': hourlyRate,
      role: role,
      department: department,
      'start-date': this.blockHeight,
      'pay-frequency': payFrequency,
      'is-active': true,
      'last-payment': 0
    });

    contract.variables['next-employee-id']++;
    return { type: 'ok', value: employeeId };
  }

  private processPayment(contract: any, args: any[], sender: string) {
    if (sender !== contract.constants.CONTRACT_OWNER) {
      return { type: 'error', value: contract.constants.ERR_UNAUTHORIZED };
    }

    const [employeeId, bonus, deductions] = args;
    const employee = contract.maps.employees.get(employeeId);

    if (!employee || !employee['is-active']) {
      return { type: 'error', value: contract.constants.ERR_EMPLOYEE_NOT_FOUND };
    }

    const baseSalary = this.calculateSalary(employee);
    const totalAmount = baseSalary - deductions + bonus;

    if (contract.variables['company-balance'] < totalAmount) {
      return { type: 'error', value: contract.constants.ERR_INSUFFICIENT_FUNDS };
    }

    // Process payment
    contract.variables['company-balance'] -= totalAmount;
    const paymentId = contract.variables['next-payment-id'];

    contract.maps['payment-history'].set(`${employeeId}-${paymentId}`, {
      amount: totalAmount,
      'payment-date': this.blockHeight,
      'period-start': employee['last-payment'],
      'period-end': this.blockHeight,
      bonus: bonus,
      deductions: deductions
    });

    employee['last-payment'] = this.blockHeight;
    contract.variables['next-payment-id']++;

    return { type: 'ok', value: totalAmount };
  }

  private fundTreasury(contract: any, args: any[], sender: string) {
    if (sender !== contract.constants.CONTRACT_OWNER) {
      return { type: 'error', value: contract.constants.ERR_UNAUTHORIZED };
    }

    const [amount] = args;
    contract.variables['company-balance'] += amount;
    return { type: 'ok', value: contract.variables['company-balance'] };
  }

  private updateSalary(contract: any, args: any[], sender: string) {
    if (sender !== contract.constants.CONTRACT_OWNER) {
      return { type: 'error', value: contract.constants.ERR_UNAUTHORIZED };
    }

    const [employeeId, newSalary] = args;
    
    if (newSalary <= 0) {
      return { type: 'error', value: contract.constants.ERR_INVALID_AMOUNT };
    }

    const employee = contract.maps.employees.get(employeeId);
    if (!employee) {
      return { type: 'error', value: contract.constants.ERR_EMPLOYEE_NOT_FOUND };
    }

    employee['annual-salary'] = newSalary;
    employee['hourly-rate'] = Math.floor(newSalary / 2080);

    return { type: 'ok', value: newSalary };
  }

  private deactivateEmployee(contract: any, args: any[], sender: string) {
    if (sender !== contract.constants.CONTRACT_OWNER) {
      return { type: 'error', value: contract.constants.ERR_UNAUTHORIZED };
    }

    const [employeeId] = args;
    const employee = contract.maps.employees.get(employeeId);

    if (!employee) {
      return { type: 'error', value: contract.constants.ERR_EMPLOYEE_NOT_FOUND };
    }

    employee['is-active'] = false;
    return { type: 'ok', value: true };
  }

  private getEmployee(contract: any, args: any[]) {
    const [employeeId] = args;
    const employee = contract.maps.employees.get(employeeId);
    return employee ? { type: 'some', value: employee } : { type: 'none' };
  }

  private getTreasuryBalance(contract: any) {
    return { type: 'ok', value: contract.variables['company-balance'] };
  }

  private getNextPayment(contract: any, args: any[]) {
    const [employeeId] = args;
    const employee = contract.maps.employees.get(employeeId);
    if (!employee) return { type: 'ok', value: 0 };
    
    const salary = this.calculateSalary(employee);
    return { type: 'ok', value: salary };
  }

  private isPaymentDue(contract: any, args: any[]) {
    const [employeeId] = args;
    const employee = contract.maps.employees.get(employeeId);
    if (!employee) return { type: 'ok', value: false };

    const frequency = employee['pay-frequency'];
    const lastPayment = employee['last-payment'];
    const blocksSincePayment = this.blockHeight - lastPayment;

    let isDue = false;
    if (frequency === 'weekly' && blocksSincePayment >= 1008) isDue = true;
    else if (frequency === 'biweekly' && blocksSincePayment >= 2016) isDue = true;
    else if (frequency === 'monthly' && blocksSincePayment >= 4320) isDue = true;

    return { type: 'ok', value: isDue };
  }

  private getEmployeeCount(contract: any) {
    return { type: 'ok', value: contract.variables['next-employee-id'] - 1 };
  }

  private calculateSalary(employee: any) {
    const annualSalary = employee['annual-salary'];
    const frequency = employee['pay-frequency'];

    if (frequency === 'weekly') return Math.floor(annualSalary / 52);
    if (frequency === 'biweekly') return Math.floor(annualSalary / 26);
    if (frequency === 'monthly') return Math.floor(annualSalary / 12);
    return 0;
  }

  mineBlock() {
    this.blockHeight++;
  }

  mineBlocks(count: number) {
    this.blockHeight += count;
  }
}

// Test suite
describe("Clarinet Payroll Smart Contract", () => {
  let clarinet: MockClarinet;
  const contractName = "payroll-contract";

  beforeEach(() => {
    clarinet = new MockClarinet();
    clarinet.deploy(contractName, "", "deployer");
  });

  describe("Employee Management", () => {
    it("should add a new employee successfully", () => {
      const result = clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          100000,
          "Software Engineer",
          "Engineering",
          "biweekly"
        ],
        "deployer"
      );

      expect(result.type).toBe("ok");
      expect(result.value).toBe(1);
    });

    it("should reject unauthorized employee addition", () => {
      const result = clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          100000,
          "Software Engineer",
          "Engineering",
          "biweekly"
        ],
        "wallet_1"
      );

      expect(result.type).toBe("error");
      expect(result.value).toBe(100); // ERR_UNAUTHORIZED
    });

    it("should reject invalid salary amounts", () => {
      const result = clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          0,
          "Software Engineer",
          "Engineering",
          "biweekly"
        ],
        "deployer"
      );

      expect(result.type).toBe("error");
      expect(result.value).toBe(103); // ERR_INVALID_AMOUNT
    });

    it("should retrieve employee information", () => {
      // Add employee first
      clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          100000,
          "Software Engineer",
          "Engineering",
          "biweekly"
        ],
        "deployer"
      );

      const result = clarinet.call(
        contractName,
        "clarinet-get-employee",
        [1],
        "deployer"
      );

      expect(result.type).toBe("some");
      expect(result.value["annual-salary"]).toBe(100000);
      expect(result.value.role).toBe("Software Engineer");
      expect(result.value["is-active"]).toBe(true);
    });

    it("should return none for non-existent employee", () => {
      const result = clarinet.call(
        contractName,
        "clarinet-get-employee",
        [999],
        "deployer"
      );

      expect(result.type).toBe("none");
    });

    it("should update employee salary", () => {
      // Add employee first
      clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          100000,
          "Software Engineer",
          "Engineering",
          "biweekly"
        ],
        "deployer"
      );

      const result = clarinet.call(
        contractName,
        "clarinet-update-salary",
        [1, 120000],
        "deployer"
      );

      expect(result.type).toBe("ok");
      expect(result.value).toBe(120000);

      // Verify the update
      const employee = clarinet.call(
        contractName,
        "clarinet-get-employee",
        [1],
        "deployer"
      );

      expect(employee.value["annual-salary"]).toBe(120000);
    });

    it("should deactivate employee", () => {
      // Add employee first
      clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          100000,
          "Software Engineer",
          "Engineering",
          "biweekly"
        ],
        "deployer"
      );

      const result = clarinet.call(
        contractName,
        "clarinet-deactivate-employee",
        [1],
        "deployer"
      );

      expect(result.type).toBe("ok");
      expect(result.value).toBe(true);

      // Verify deactivation
      const employee = clarinet.call(
        contractName,
        "clarinet-get-employee",
        [1],
        "deployer"
      );

      expect(employee.value["is-active"]).toBe(false);
    });
  });

  describe("Treasury Management", () => {
    it("should fund treasury successfully", () => {
      const result = clarinet.call(
        contractName,
        "clarinet-fund-treasury",
        [500000],
        "deployer"
      );

      expect(result.type).toBe("ok");
      expect(result.value).toBe(500000);
    });

    it("should reject unauthorized treasury funding", () => {
      const result = clarinet.call(
        contractName,
        "clarinet-fund-treasury",
        [500000],
        "wallet_1"
      );

      expect(result.type).toBe("error");
      expect(result.value).toBe(100); // ERR_UNAUTHORIZED
    });

    it("should return correct treasury balance", () => {
      // Fund treasury
      clarinet.call(
        contractName,
        "clarinet-fund-treasury",
        [500000],
        "deployer"
      );

      const result = clarinet.call(
        contractName,
        "clarinet-get-treasury-balance",
        [],
        "deployer"
      );

      expect(result.type).toBe("ok");
      expect(result.value).toBe(500000);
    });
  });

  describe("Payment Processing", () => {
    beforeEach(() => {
      // Setup: Add employee and fund treasury
      clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          104000, // $104k annually
          "Software Engineer",
          "Engineering",
          "biweekly"
        ],
        "deployer"
      );

      clarinet.call(
        contractName,
        "clarinet-fund-treasury",
        [500000],
        "deployer"
      );
    });

    it("should process payment successfully", () => {
      const result = clarinet.call(
        contractName,
        "clarinet-process-payment",
        [1, 1000, 500], // employee-id, bonus, deductions
        "deployer"
      );

      expect(result.type).toBe("ok");
      // Biweekly payment: 104000/26 = 4000, + 1000 bonus - 500 deductions = 4500
      expect(result.value).toBe(4500);
    });

    it("should reject payment with insufficient funds", () => {
      // Drain treasury first
      clarinet.call(
        contractName,
        "clarinet-process-payment",
        [1, 0, 0],
        "deployer"
      );

      // Try another payment
      const result = clarinet.call(
        contractName,
        "clarinet-process-payment",
        [1, 500000, 0], // Huge bonus that exceeds remaining balance
        "deployer"
      );

      expect(result.type).toBe("error");
      expect(result.value).toBe(102); // ERR_INSUFFICIENT_FUNDS
    });

    it("should reject payment for non-existent employee", () => {
      const result = clarinet.call(
        contractName,
        "clarinet-process-payment",
        [999, 0, 0],
        "deployer"
      );

      expect(result.type).toBe("error");
      expect(result.value).toBe(101); // ERR_EMPLOYEE_NOT_FOUND
    });

    it("should reject payment for inactive employee", () => {
      // Deactivate employee first
      clarinet.call(
        contractName,
        "clarinet-deactivate-employee",
        [1],
        "deployer"
      );

      const result = clarinet.call(
        contractName,
        "clarinet-process-payment",
        [1, 0, 0],
        "deployer"
      );

      expect(result.type).toBe("error");
      expect(result.value).toBe(101); // ERR_EMPLOYEE_NOT_FOUND
    });
  });

  describe("Salary Calculations", () => {
    it("should calculate correct biweekly payment", () => {
      clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          104000,
          "Software Engineer",
          "Engineering",
          "biweekly"
        ],
        "deployer"
      );

      const result = clarinet.call(
        contractName,
        "clarinet-get-next-payment",
        [1],
        "deployer"
      );

      expect(result.type).toBe("ok");
      expect(result.value).toBe(4000); // 104000 / 26
    });

    it("should calculate correct weekly payment", () => {
      clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          104000,
          "Software Engineer",
          "Engineering",
          "weekly"
        ],
        "deployer"
      );

      const result = clarinet.call(
        contractName,
        "clarinet-get-next-payment",
        [1],
        "deployer"
      );

      expect(result.type).toBe("ok");
      expect(result.value).toBe(2000); // 104000 / 52
    });

    it("should calculate correct monthly payment", () => {
      clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          120000,
          "Software Engineer",
          "Engineering",
          "monthly"
        ],
        "deployer"
      );

      const result = clarinet.call(
        contractName,
        "clarinet-get-next-payment",
        [1],
        "deployer"
      );

      expect(result.type).toBe("ok");
      expect(result.value).toBe(10000); // 120000 / 12
    });
  });

  describe("Payment Due Checks", () => {
    beforeEach(() => {
      clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          104000,
          "Software Engineer",
          "Engineering",
          "weekly"
        ],
        "deployer"
      );
    });

    it("should return false for payment not yet due", () => {
      const result = clarinet.call(
        contractName,
        "clarinet-is-payment-due",
        [1],
        "deployer"
      );

      expect(result.type).toBe("ok");
      expect(result.value).toBe(false);
    });

    it("should return true for weekly payment due", () => {
      // Mine enough blocks to simulate a week passing
      clarinet.mineBlocks(1008);

      const result = clarinet.call(
        contractName,
        "clarinet-is-payment-due",
        [1],
        "deployer"
      );

      expect(result.type).toBe("ok");
      expect(result.value).toBe(true);
    });
  });

  describe("Employee Count", () => {
    it("should return correct employee count", () => {
      // Initially should be 0
      let result = clarinet.call(
        contractName,
        "clarinet-get-employee-count",
        [],
        "deployer"
      );

      expect(result.type).toBe("ok");
      expect(result.value).toBe(0);

      // Add two employees
      clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          100000,
          "Software Engineer",
          "Engineering",
          "biweekly"
        ],
        "deployer"
      );

      clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
          80000,
          "Designer",
          "Design",
          "monthly"
        ],
        "deployer"
      );

      result = clarinet.call(
        contractName,
        "clarinet-get-employee-count",
        [],
        "deployer"
      );

      expect(result.type).toBe("ok");
      expect(result.value).toBe(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple employees with different pay frequencies", () => {
      // Add weekly employee
      const weekly = clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          52000,
          "Junior Dev",
          "Engineering",
          "weekly"
        ],
        "deployer"
      );

      // Add monthly employee
      const monthly = clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
          120000,
          "Senior Dev",
          "Engineering",
          "monthly"
        ],
        "deployer"
      );

      expect(weekly.value).toBe(1);
      expect(monthly.value).toBe(2);

      // Check different payment amounts
      const weeklyPayment = clarinet.call(
        contractName,
        "clarinet-get-next-payment",
        [1],
        "deployer"
      );

      const monthlyPayment = clarinet.call(
        contractName,
        "clarinet-get-next-payment",
        [2],
        "deployer"
      );

      expect(weeklyPayment.value).toBe(1000); // 52000 / 52
      expect(monthlyPayment.value).toBe(10000); // 120000 / 12
    });

    it("should handle zero bonus and deductions in payment", () => {
      clarinet.call(
        contractName,
        "clarinet-add-employee",
        [
          "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
          52000,
          "Developer",
          "Engineering",
          "weekly"
        ],
        "deployer"
      );

      clarinet.call(
        contractName,
        "clarinet-fund-treasury",
        [100000],
        "deployer"
      );

      const result = clarinet.call(
        contractName,
        "clarinet-process-payment",
        [1, 0, 0],
        "deployer"
      );

      expect(result.type).toBe("ok");
      expect(result.value).toBe(1000); // Base weekly salary
    });
  });
});