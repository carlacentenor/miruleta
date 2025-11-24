const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const addBtn = document.getElementById('addBtn');
const clearBtn = document.getElementById('clearBtn');
const nameInput = document.getElementById('nameInput');
const winnerDiv = document.getElementById('winner');
const noRepeatSwitch = document.getElementById('noRepeatSwitch');

let names = [];
let allNames = []; // Guardamos TODOS los nombres originales
let currentRotation = 0;
let isSpinning = false;

const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
];

function drawWheel() {
    if (names.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(200, 200, 200, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#999';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Agrega nombres', 200, 200);
        return;
    }

    const centerX = 200;
    const centerY = 200;
    const radius = 200;
    const sliceAngle = (2 * Math.PI) / names.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);


    names.forEach((name, i) => {

        const startAngle = -Math.PI / 2 + currentRotation + (sliceAngle * i);
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Dibujamos el texto en el centro del segmento
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(name, radius - 20, 5);
        ctx.restore();
    });

    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();
}

function getWinnerIndex() {
    const sliceAngle = (2 * Math.PI) / names.length;

    
    let normalized = currentRotation % (2 * Math.PI);
    while (normalized < 0) normalized += 2 * Math.PI;

    
    const rotation = normalized / (2 * Math.PI);

    
    const index = Math.floor((1 - rotation) * names.length) % names.length;

    return index;
}

function addNames() {
    const input = nameInput.value.trim();
    if (!input) return;

    const newNames = input.split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);

    allNames = [...new Set(newNames)]; 
    names = [...allNames]; 
    drawWheel();
    winnerDiv.textContent = '';
}

function clearNames() {
    names = [];
    allNames = [];
    nameInput.value = '';
    currentRotation = 0;
    drawWheel();
    winnerDiv.textContent = '';
}

function spinWheel() {
    window.dataLayer.push({ 'event': 'girar_ruleta' });
    if (isSpinning || names.length === 0) return;

    isSpinning = true;
    spinBtn.disabled = true;
    winnerDiv.textContent = '🎲 Girando...';

    const spins = 5 + Math.random() * 3;

 
    const sliceAngle = (2 * Math.PI) / names.length;
    const randomSegmentIndex = Math.floor(Math.random() * names.length);

    // Agregamos un offset aleatorio dentro del segmento (evitando los bordes)
    // Usamos entre 20% y 80% del segmento para evitar caer cerca de las líneas
    const segmentOffset = (0.2 + Math.random() * 0.6) * sliceAngle;
    const targetAngle = (randomSegmentIndex * sliceAngle) + segmentOffset;

    const totalRotation = (spins * 2 * Math.PI) + targetAngle;

    const duration = 4000;
    const startTime = performance.now();
    const startRotation = currentRotation;

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = 1 - Math.pow(1 - progress, 3);

        currentRotation = startRotation + (totalRotation * easeOut);
        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            spinBtn.disabled = false;

            const winnerIndex = getWinnerIndex();
            const winnerName = names[winnerIndex];
            winnerDiv.textContent = `🎉 Ganador: ${winnerName}`;


            // Debug detallado
            console.log('===== DEBUG GANADOR =====');
            console.log('Índice calculado:', winnerIndex);
            console.log('Nombre ganador:', winnerName);
            console.log('Nombres restantes:', names.length);
            console.log('========================');
        }


    }

    requestAnimationFrame(animate);
}

function highlightWinner(winnerIndex) {
    // Redibujamos con el segmento ganador resaltado
    const centerX = 200;
    const centerY = 200;
    const radius = 200;
    const sliceAngle = (2 * Math.PI) / names.length;

    // Dibujamos un borde grueso en el segmento ganador
    const startAngle = -Math.PI / 2 + currentRotation + (sliceAngle * winnerIndex);
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineTo(centerX, centerY);
    ctx.strokeStyle = '#FFD700'; // Dorado
    ctx.lineWidth = 8;
    ctx.stroke();

    // Dibujamos una estrella en el segmento ganador
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.font = 'bold 30px Arial';
    ctx.fillText('⭐', radius / 2, 10);
    ctx.restore();
}

// Pruebas manuales paso a paso
function testStep() {
    if (names.length === 0) {
        console.log('⚠️ Primero agrega nombres a la ruleta');
        return;
    }

    console.log('\n=== TEST MANUAL ===');
    console.log('Nombres:', names);
    console.log('\nRotando 360° / cantidad de nombres para probar cada posición...\n');

    const sliceAngle = (2 * Math.PI) / names.length;

    for (let i = 0; i < names.length; i++) {
        currentRotation = sliceAngle * i;
        const winner = getWinnerIndex();
        console.log(`Posición ${i} (${(currentRotation * 180 / Math.PI).toFixed(1)}°): Índice ${winner} = "${names[winner]}"`);

        // Pequeña pausa visual
        drawWheel();
    }

    currentRotation = 0;
    drawWheel();
    console.log('\n=== FIN TEST ===\n');
}

// Event listeners
addBtn.addEventListener('click', addNames);
clearBtn.addEventListener('click', clearNames);
spinBtn.addEventListener('click', spinWheel);




nameInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        addNames();
    }
});

// Exponer función de test
window.testStep = testStep;

// Agregar click en el canvas para test rápido
canvas.addEventListener('click', () => {
    if (!isSpinning && names.length > 0) {
        const winner = getWinnerIndex();
        console.log(`Click - Ganador actual: ${names[winner]} (índice ${winner})`);
    }
});

// Cargar nombres iniciales al inicio
window.addEventListener('DOMContentLoaded', () => {
    addNames();
});

// Obtiene el elemento con el ID "currentYear" y le inserta el año actual
document.getElementById('currentYear').textContent = new Date().getFullYear();
drawWheel();