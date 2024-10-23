const assistantImage = document.getElementById('assistant-image');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn'); // Botón de detener
const responseElement = document.getElementById('response');

// Función para abrir el modal de la imagen
function openImageModal() {
    const imageModal = document.getElementById('imageModal');
    imageModal.style.display = 'block'; // Mostrar el modal
}

// Función para cerrar el modal de la imagen
function closeImageModal() {
    const imageModal = document.getElementById('imageModal');
    imageModal.style.display = 'none'; // Ocultar el modal
}

// Configuración de la API de reconocimiento de voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES'; // Cambia según el idioma que prefieras

// API de síntesis de voz
const synth = window.speechSynthesis;

// Función para mostrar el botón de detener y ocultar el de hablar cuando el asistente esté hablando
function showStopButton() {
    stopBtn.style.display = 'block'; // Mostrar el botón de detener
    startBtn.style.display = 'none'; // Ocultar el botón de hablar
}

// Función para ocultar el botón de detener y mostrar el de hablar cuando el asistente no esté hablando
function hideStopButton() {
    stopBtn.style.display = 'none'; // Ocultar el botón de detener
    startBtn.style.display = 'block'; // Mostrar el botón de hablar
}

// Función para detener la síntesis de voz
function stopAssistant() {
    if (synth.speaking) {
        synth.cancel(); // Detener la síntesis de voz
        hideStopButton(); // Ocultar el botón de detener y mostrar el de hablar
    }
}

// Asignar evento al botón de detener
stopBtn.addEventListener('click', stopAssistant);

// Función para actualizar el contenido del cuadro de texto con scroll y expandir el cuadro
function updateResponse(content) {
    if (content.trim() !== '') {
        responseElement.textContent = content;
        responseElement.classList.remove('hidden');
        responseElement.classList.add('response-expanded'); // Expande el cuadro de texto
        assistantImage.classList.add('image-up'); // Sube la imagen del asistente
    } else {
        responseElement.classList.add('hidden');
        responseElement.textContent = '';
        responseElement.classList.remove('response-expanded'); // Restablece el tamaño del cuadro
        assistantImage.classList.remove('image-up'); // Restablece la posición de la imagen
    }
}

// Simulación de agregar contenido (puedes cambiar esto por el evento real que uses)
startBtn.addEventListener('click', function() {
    const exampleContent = "Este es un ejemplo de contenido generado.";
    updateResponse(exampleContent);
});

// Función para hacer la consulta al servidor proxy (en lugar de directamente a OpenAI)
async function askChatGPT(question) {
    try {
        const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: question })
        });

        if (!response.ok) {
        throw new Error('Error en la respuesta del servidor proxy');
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('Error al llamar al proxy:', error);
        return 'Lo siento, hubo un problema al conectarse al servidor.';
    }
}

// Cuando el reconocimiento de voz comienza
recognition.onstart = function() {
    assistantImage.classList.add('listening');
    responseElement.textContent = "Escuchando...";
};

// Cuando se detiene el reconocimiento de voz
recognition.onspeechend = function() {
    recognition.stop();
    assistantImage.classList.remove('listening');
};

// Cuando se recibe una transcripción de voz
recognition.onresult = async function(event) {
    const userInput = event.results[0][0].transcript;
    responseElement.textContent = `Tú: ${userInput}`;
  
    // Detener cualquier síntesis de voz en curso
    if (synth.speaking) {
        synth.cancel();
    }

    // Llamar a la función de consulta a través del proxy
    const chatResponse = await askChatGPT(userInput);
  
    // Mostrar la respuesta en el cuadro de texto con scroll y expandir el cuadro
    responseElement.textContent += `\nAsistente: ${chatResponse}`;
    responseElement.classList.add('response-expanded'); // Expande el cuadro de texto
    assistantImage.classList.add('image-up'); // Sube la imagen del asistente
  
    // Leer la respuesta en voz alta
    const utterance = new SpeechSynthesisUtterance(chatResponse);
    utterance.lang = 'es-ES';
    utterance.rate = 1; // Velocidad normal
    utterance.pitch = 1; // Tono normal
  
    synth.speak(utterance);
    showStopButton(); // Mostrar el botón de detener y ocultar el de hablar

    // Cuando el asistente termine de hablar, ocultar el botón de detener y mostrar el de hablar
    utterance.onend = function() {
        hideStopButton();
    };
};

// Evento para iniciar la escucha de voz
startBtn.addEventListener('click', () => {
    recognition.start();
    showStopButton(); // Mostrar el botón de detener y ocultar el de hablar cuando se inicia la escucha
});

// Manejo de errores en reconocimiento de voz
recognition.onerror = function(event) {
    console.error('Error en el reconocimiento de voz:', event.error);
    responseElement.textContent = 'Error en el reconocimiento de voz. Intenta de nuevo.';
};
