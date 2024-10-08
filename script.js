// Operation Code Table (OPTAB)
const optab = {
    "LDA": "00",
    "STA": "0C",
    "LDCH": "50",
    "STCH": "54",
    "END": "--"
};

// Function to execute Pass 1 of the assembler
function performPass1() {
    const assemblyCode = document.getElementById('assemblyCode').value;
    const lines = assemblyCode.split('\n');
    let currentAddress = 0x2000; // Starting address
    const symbolTable = {};
    let intermediateFileContent = []; // Intermediate file content

    // Clear previous content in tables and intermediate file display
    document.querySelector("#symbolTable tbody").innerHTML = "";
    document.getElementById('intermediateFileContainer').innerHTML = ""; // Clear previous intermediate file

    // Process each line of assembly code
    lines.forEach((line) => {
        const cleanLine = line.trim();

        // Skip empty lines or comment lines starting with '-'
        if (cleanLine === "" || cleanLine.startsWith("-")) return;

        const parts = cleanLine.split(/\s+/);
        const label = parts.length > 2 ? parts[0] : null;
        const instruction = label ? parts[1] : parts[0];
        const operand = parts.length > 2 ? parts[2] : (parts.length > 1 ? parts[1] : null);

        // Add label to the symbol table if it exists
        if (label) {
            symbolTable[label] = currentAddress;
            addRowToTable("symbolTable", label, currentAddress.toString(16).toUpperCase().padStart(4, '0'));
        }

        // Log the address and instruction for the intermediate file
        intermediateFileContent.push(`${currentAddress.toString(16).toUpperCase().padStart(4, '0')} ${cleanLine}`);

        // Check if the instruction exists in OPTAB
        if (optab[instruction]) {
            addRowToTable("optab", instruction, optab[instruction]);
            currentAddress += 3; // Increment the address by 3 (assuming each instruction takes 3 bytes)
        }

        // Handle memory allocation instructions
        if (instruction === "RESW") {
            currentAddress += 3 * parseInt(operand); // RESW reserves 3 bytes per word
        } else if (instruction === "RESB") {
            currentAddress += parseInt(operand); // RESB reserves 1 byte
        } else if (instruction === "WORD") {
            currentAddress += 3; // WORD takes 3 bytes
        } else if (instruction === "BYTE") {
            currentAddress += operand.startsWith("C'") ? operand.length - 3 : (operand.startsWith("X'") ? (operand.length - 3) / 2 : 0);
        }
    });

    // Display the intermediate file
    displayIntermediateFile(intermediateFileContent);
}

// Function to add rows to the symbol table or OPTAB
function addRowToTable(tableId, col1, col2) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    const newRow = document.createElement('tr');

    const firstCell = document.createElement('td');
    firstCell.textContent = col1;

    const secondCell = document.createElement('td');
    secondCell.textContent = col2;

    newRow.appendChild(firstCell);
    newRow.appendChild(secondCell);
    tableBody.appendChild(newRow);
}

// Function to display the intermediate file
function displayIntermediateFile(content) {
    const intermediateFileContainer = document.getElementById('intermediateFileContainer');
    intermediateFileContainer.innerHTML = "<h2>Intermediate File</h2>";

    content.forEach(line => {
        const lineElement = document.createElement('p');
        lineElement.textContent = line; // Each line contains address and instruction
        intermediateFileContainer.appendChild(lineElement);
    });

    // Automatically paste intermediate file content into Pass 2 input
    document.getElementById('intermediateInput').value = content.join('\n');
}

// Function to execute Pass 2 of the assembler
function performPass2() {
    const intermediateFile = document.getElementById('intermediateInput').value.split('\n');
    const objectCodeLines = [];
    const textRecords = [];
    let startAddress = '';
    let currentTextRecord = '';
    let programName = 'TESTPROG'; // Placeholder program name

    // Loop through the intermediate file and generate object code
    intermediateFile.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const address = parts[0];
        const instruction = parts[1];
        const operand = parts[2];

        if (instruction === 'START') {
            startAddress = operand;
        } else if (optab[instruction]) {
            const opcode = optab[instruction];
            const objCode = opcode + (operand ? operand.padStart(4, '0') : '0000');
            objectCodeLines.push(`${address} ${objCode}`);
            currentTextRecord += objCode;
            if (currentTextRecord.length >= 60) {
                textRecords.push(currentTextRecord);
                currentTextRecord = '';
            }
        }
    });

    // Write final text record and object code
    if (currentTextRecord.length > 0) {
        textRecords.push(currentTextRecord);
    }

    const headerRecord = `H${programName.padEnd(6, ' ')}${startAddress.padStart(6, '0')}${(objectCodeLines.length * 3).toString(16).padStart(6, '0')}`;
    const endRecord = `E${startAddress.padStart(6, '0')}`;

    const objectProgram = [headerRecord, ...textRecords.map(tr => `T${startAddress.padStart(6, '0')}${(tr.length / 2).toString(16).padStart(2, '0')}${tr}`), endRecord];

    // Display the object program and object code
    document.getElementById('objectCode').value = objectCodeLines.join('\n');
    document.getElementById('objectProgramFile').value = objectProgram.join('\n');
}
