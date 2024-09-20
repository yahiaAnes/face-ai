const imageUpload = document.getElementById('imageUpload');
const uploadedImage = document.getElementById('uploaded-image');
const canvas = document.getElementById('canvas');
const DPI = 96; // Assuming 96 DPI for the screen

// Convert pixels to centimeters
function pxToCm(px) {
  return (px / DPI) * 2.54;
}

// Load face-api models
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(() => console.log('Models loaded'));

imageUpload.addEventListener('change', async () => {
  const file = imageUpload.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    uploadedImage.src = e.target.result;
    uploadedImage.style.display = 'block';
    await handleFaceDetection(uploadedImage);
  };
  reader.readAsDataURL(file);
});

async function handleFaceDetection(input) {
  // Set canvas dimensions to match the input image
  canvas.width = input.width;
  canvas.height = input.height;
  const displaySize = { width: input.width, height: input.height };
  faceapi.matchDimensions(canvas, displaySize);

  // Detect faces and landmarks
  const detections = await faceapi.detectAllFaces(input, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions();

  const resizedDetections = faceapi.resizeResults(detections, displaySize);
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw face landmarks and expressions
  faceapi.draw.drawDetections(canvas, resizedDetections);
  faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

  // If there are detections, calculate and display measurements
  if (resizedDetections.length > 0) {
    const landmarks = resizedDetections[0].landmarks;
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const mouth = landmarks.getMouth();

    // Calculate the distance between eyes
    const eyeDistancePx = Math.hypot(
      rightEye[0].x - leftEye[0].x,
      rightEye[0].y - leftEye[0].y
    );

    // Calculate the mouth width
    const mouthWidthPx = Math.hypot(
      mouth[6].x - mouth[0].x,
      mouth[6].y - mouth[0].y
    );

    // Convert distances from pixels to centimeters
    const eyeDistanceCm = pxToCm(eyeDistancePx);
    const mouthWidthCm = pxToCm(mouthWidthPx);

    // Display the dimensions on the canvas
    context.font = '20px Arial';
    context.fillStyle = 'red';
    context.fillText(`Eye Distance: ${eyeDistanceCm.toFixed(2)} cm`, 50, 50);
    context.fillText(`Mouth Width: ${mouthWidthCm.toFixed(2)} cm`, 50, 80);
  }
}
