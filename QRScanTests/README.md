# QR Code Scanning Tests
This folder contains a simple Python script to test the reliability of QR code
scanning methods for the MySoMeID use-case. The test proceeds as follows:
- Generate QR code with random data.
- Add QR code to provided background image in random position.
- Save resulting image as JPEG with high compression.
- Read stored JPEG file and resize to a smaller size.
- Save resized image again as JPEG with same compression.
- Load JPEG and optionally apply pre-processing. This comprises:
	- Scaling the image back up.
	- Apply slight Gaussian blur to remove artifacts.
	- Binarize with fixed threshold to obtain black and white image.
- Read QR code data using ZBar library.
- Compare the read data with the original data.

All tests are repeated multiple times for different configurations. For all
configurations, the success rate and the average processing time are reported.
