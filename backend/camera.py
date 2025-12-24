import cv2

# Global variable to store the latest status for the frontend API
last_status = "Safe"

class VideoCamera:
    def __init__(self):
        self.video = cv2.VideoCapture(0)
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

    def __del__(self):
        self.video.release()

    def get_frame(self):
        global last_status
        success, img = self.video.read()
        if not success:
            return None

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(60, 60))

        height, width, _ = img.shape
        center_x_min = width // 4
        center_x_max = 3 * (width // 4)
        
        status_text = "Safe"
        
        if len(faces) == 0:
            status_text = "No Face Detected"
            last_status = "missing" # Update global status
        elif len(faces) > 1:
            status_text = "Multiple People"
            last_status = "multiple"
        else:
            last_status = "safe" # Reset to safe
            for (x, y, w, h) in faces:
                face_center_x = x + (w // 2)
                if face_center_x < center_x_min or face_center_x > center_x_max:
                    status_text = "Looking Away"
                    last_status = "looking_away"
                
                # Draw Box
                color = (0, 0, 255) if last_status != "safe" else (0, 255, 0)
                cv2.rectangle(img, (x, y), (x+w, y+h), color, 2)

        # Draw visual text on video as backup
        cv2.putText(img, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255) if last_status != "safe" else (0, 255, 0), 2)

        ret, jpeg = cv2.imencode('.jpg', img)
        return jpeg.tobytes()