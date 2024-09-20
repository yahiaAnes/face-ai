const video = document.getElementById('video');
const DPI = 96; // Assuming 96 DPI for the screen

// Convert pixels to centimeters
function pxToCm(px) {
  return (px / DPI) * 2.54;
}

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  );
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the face landmarks and other info
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    if (resizedDetections.length > 0) {
      const landmarks = resizedDetections[0].landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const mouth = landmarks.getMouth();

      // Calculate the distance between eyes (Pythagorean Theorem)
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
  }, 100);
});
