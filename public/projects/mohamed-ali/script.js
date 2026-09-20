class Calculator {
    constructor() {
        this.display = document.getElementById('display');
        this.previousValue = '';
        this.currentValue = '';
        this.operator = null;
        this.shouldResetDisplay = false;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Number buttons
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleNumberClick(e.target.dataset.number);
            });
        });

        // Function buttons
        document.querySelectorAll('.function-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFunctionClick(e.target.dataset.action);
            });
        });

        // Equals button
        document.querySelector('.equals-btn').addEventListener('click', () => {
            this.calculate();
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }

    handleNumberClick(number) {
        if (this.shouldResetDisplay) {
            this.currentValue = '';
            this.shouldResetDisplay = false;
        }
        this.currentValue += number;
        this.updateDisplay();
    }

    handleFunctionClick(action) {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'delete':
                this.delete();
                break;
            case 'decimal':
                this.addDecimal();
                break;
            case 'divide':
            case 'multiply':
            case 'subtract':
            case 'add':
                this.setOperator(action);
                break;
        }
    }

    setOperator(newOperator) {
        if (this.currentValue === '') return;

        if (this.previousValue !== '' && this.operator) {
            this.calculate();
        }

        this.operator = newOperator;
        this.previousValue = this.currentValue;
        this.currentValue = '';
        this.shouldResetDisplay = true;
    }

    calculate() {
        if (this.operator === null || this.currentValue === '' || this.previousValue === '') {
            return;
        }

        let result;
        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.currentValue);

        switch (this.operator) {
            case 'add':
                result = prev + current;
                break;
            case 'subtract':
                result = prev - current;
                break;
            case 'multiply':
                result = prev * current;
                break;
            case 'divide':
                result = current === 0 ? 'Error' : prev / current;
                break;
            default:
                return;
        }

        this.currentValue = result.toString();
        this.operator = null;
        this.previousValue = '';
        this.shouldResetDisplay = true;
        this.updateDisplay();
    }

    addDecimal() {
        if (this.shouldResetDisplay) {
            this.currentValue = '0';
            this.shouldResetDisplay = false;
        }
        if (!this.currentValue.includes('.')) {
            this.currentValue += '.';
            this.updateDisplay();
        }
    }

    clear() {
        this.currentValue = '';
        this.previousValue = '';
        this.operator = null;
        this.shouldResetDisplay = false;
        this.updateDisplay();
    }

    delete() {
        this.currentValue = this.currentValue.toString().slice(0, -1);
        this.updateDisplay();
    }

    updateDisplay() {
        this.display.value = this.currentValue || '0';
    }

    handleKeyboard(e) {
        if (e.key >= '0' && e.key <= '9') {
            this.handleNumberClick(e.key);
        } else if (e.key === '.') {
            this.addDecimal();
        } else if (e.key === '+') {
            this.setOperator('add');
        } else if (e.key === '-') {
            this.setOperator('subtract');
        } else if (e.key === '*') {
            this.setOperator('multiply');
        } else if (e.key === '/') {
            e.preventDefault();
            this.setOperator('divide');
        } else if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            this.calculate();
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            this.delete();
        } else if (e.key === 'Escape') {
            this.clear();
        }
    }
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});