"""Test the reliability of QR code scanning for the MySoMeID use-case."""
import random
import secrets
import base64
import itertools
from pathlib import Path
from timeit import default_timer as timer
from tabulate import tabulate
import qrcode
from qrcode.image.pil import PilImage
from PIL import Image, ImageDraw, ImageFont
import cv2
from pyzbar.pyzbar import decode
from pyzbar.pyzbar import ZBarSymbol

# configuration
IMAGE_DIR = "./images/"  # directory to save intermediate images
BACKGROUNDS = [
    # "./backgrounds/black.png",
    # "./backgrounds/white.png",
    # "./backgrounds/checkerboard.png",
    "./backgrounds/hacker.jpg",
]
INDEX_LENGTH = 8  # number of bytes used for "smart contract index"
KEY_LENGTH = 32  # number of bytes used for decryption key
BOX_SIZES = [3, 4]
QUIET_ZONE_SIZES = 4  # number of white boxes around QR code.
# Note: quiet_zone_size should be at least 4 according to the specification.
EC_LEVELS = [
    qrcode.constants.ERROR_CORRECT_L,
    # qrcode.constants.ERROR_CORRECT_M,
    # qrcode.constants.ERROR_CORRECT_Q,
    qrcode.constants.ERROR_CORRECT_H,
]
BORDER_COLORS = [
    # "#f5b2c0",  # light pink
    "#AA336A",  # dark pink
    # "#000000",  # black
]
JPEG_QUALITIES = [
    80,
    50,
    # 10
]
SIZES = [
    (1400, 350),  # Some size LinkedIn often provides. Must work with this.
    (800, 200),  # Smaller size provided by LinkedIn. Must work with this.
    (800, 150),  # nonproportional scaling
    # (400, 100),  # extremely small test
]
NUM_ITERATIONS = 100  # how often to repeat for each configuration


def qr_ec_level_to_str(qr_ec_level):
    """
    Convert integer representing QR code error correction level to string.

    Parameters
    ----------
    qr_ec_level : int
        Error correction level in {qrcode.constants.ERROR_CORRECT_X |
        X in {L, M, Q, H}}.

    Returns
    -------
    str
        The string "L", "M", "Q", or "H" (or "?" for invalid input).
    """
    if qr_ec_level == qrcode.constants.ERROR_CORRECT_L:
        return "L"
    elif qr_ec_level == qrcode.constants.ERROR_CORRECT_M:
        return "M"
    elif qr_ec_level == qrcode.constants.ERROR_CORRECT_Q:
        return "Q"
    elif qr_ec_level == qrcode.constants.ERROR_CORRECT_H:
        return "H"
    else:
        return "?"


def generate_qr_data(index_length, key_length):
    """
    Generate a QR code with the specified parameters.

    This generates random data to embed in the QR code and adds a frame with
    the specified color.

    Parameters
    ----------
    index_length : int
        The number of bytes to use for the index in the smart contract.
    key_length : int
        The number of bytes to use for the decryption key.

    Returns
    -------
    str
        The generated string.
    """
    # create random data and encode in URL
    index_bytes = secrets.token_bytes(index_length)
    key_bytes = secrets.token_bytes(key_length)
    # note that urlsafe_b64encode can contain =, but not relevant for this test
    index_str = base64.urlsafe_b64encode(index_bytes).decode()
    key_str = base64.urlsafe_b64encode(key_bytes).decode()

    return "https://mysomeid.com/v?i=" + index_str + "&k=" + key_str


def generate_qr_code(data, box_size, quiet_zone_size, error_correction, border_color):
    """
    Generate a QR code with the specified parameters.

    This also adds a frame around the QR code with the specified color.

    Parameters
    ----------
    data : str
        The data to encode in the QR code
    box_size : int
        The number of pixels to use for each box in the QR code.
    quiet_zone_size : int
        The number of boxes to use for the white quiet zone around the QR code.
        Note: This value should be at least 4 according to the specification.
    error_correction : int
        Determines the error correction level. Must be in
        {qrcode.constants.ERROR_CORRECT_X | X in {L, M, Q, H}},
        where levels L, M, Q, and H can correct about 7%, 15%, 25%, and 30%
        of errors, respectively.
    border_color : str
        The color to use for the border encoded as RGB hex string.

    Returns
    -------
    PilImage
        The image of the QR code including a frame.
    """
    # set QR code settings as specified
    qr_code = qrcode.QRCode(
        error_correction=error_correction, box_size=box_size, border=quiet_zone_size
    )

    # generate image with QR code
    qr_code.add_data(data)
    qr_img = qr_code.make_image(image_factory=PilImage)

    # generate larger image to contain border
    (qr_width, qr_height) = qr_img.size
    qr_width += 8  # add border to both sides 4 pixels wide
    qr_height += 48  # additional space below to add text
    img = Image.new(mode="RGB", size=(qr_width, qr_height), color=border_color)

    # add text in border below QR code
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype("Pillow/Tests/fonts/DejaVuSans.ttf", 14)
    draw.text(xy=(8, qr_height - 40), text="Verified by", font=font)
    draw.text(xy=(8, qr_height - 20), text="MySoMeID", font=font)

    # paste QR code image on top of img and return result
    img.paste(qr_img, (4, 4))
    return img


def add_qr_code_to_background(background_img, qr_img):
    """
    Create image with qr_img placed in random position on background_img.

    Parameters
    ----------
    background_img : PilImage
        Background image.
    qr_img : PilImage
        Image of QR code.

    Returns
    -------
    PilImage
        Image with QR placed in random position on background.
    """
    new_background = background_img.copy()
    (background_width, background_height) = new_background.size
    (qr_width, qr_height) = qr_img.size

    # place QR code at random position
    x_pos = random.randint(0, background_width - qr_width)
    y_pos = random.randint(0, background_height - qr_height)
    new_background.paste(qr_img, (x_pos, y_pos))
    return new_background


def degrade_scale_image(img, quality, size, filename):
    """
    Scale the image to given dimensions and degrade quality.

    This first saves the image as JPEG with given quality setting, then loads
    the file, scales it, and again saves  as JPEG with the same quality.

    Parameters
    ----------
    img : PilImage
        Image to start with.
    quality : int
        JPEG quality setting.
    size : (int, int)
        Target size as (width, height).
    filename : str
        Filename without extension to use for storing intermediate images.

    Returns
    -------
    str
        Path to jpeg file of degraded image.
    """
    jpg1_filename = IMAGE_DIR + filename + "_q" + str(quality) + ".jpg"
    jpg2_filename = (
        IMAGE_DIR
        + filename
        + "_q"
        + str(quality)
        + "_"
        + str(size[0])
        + "x"
        + str(size[1])
        + ".jpg"
    )
    img.save(jpg1_filename, quality=quality)
    img2 = Image.open(jpg1_filename)
    img2 = img2.resize(size=size)
    img2.save(jpg2_filename, quality=quality)
    return jpg2_filename


def preprocess_image(img):
    """
    Pre-process image to improve QR code scanning.

    This resizes the image, applies a Gaussian blur to remove artifacts,
    and binarizes to obtain a black and white image.

    Parameters
    ----------
    img : numpy.ndarray
        Grayscale image in OpenCV format.

    Returns
    -------
    numpy.ndarray
        Image after pre-processing.
    """
    # Resize to original size.
    # Note: Scaling up the image more increases the recognition
    # but also the processing time.
    resized = cv2.resize(img, (1600, 800), interpolation=cv2.INTER_AREA)

    # Slightly blur image to remove artifacts.
    # Note: If image is scaled up more, the kernel size (5, 5)
    # should also be increased.
    blurred = cv2.GaussianBlur(resized, (5, 5), 0)

    # Binarize to black and white. We here use a fixed threshold so that the
    # non-QR-code part of the image does not interfere with the thresholding.
    _, binarized = cv2.threshold(blurred, 128, 255, cv2.THRESH_BINARY)

    return binarized


def read_qr_code(img):
    """
    Read QR code from image and return extracted data.

    Parameters
    ----------
    img : numpy.ndarray
        Image in OpenCV format.

    Returns
    -------
    str
        Extracted data, or empty string if reading failed.
    """
    decoded = decode(img, symbols=[ZBarSymbol.QRCODE])
    if len(decoded) > 0:
        return decoded[0].data.decode()
    else:
        return ""


def create_and_read(
    background_file,
    index_length,
    key_length,
    box_size,
    error_correction,
    border_color,
    quality,
    scale_to,
    do_preprocess,
):
    """
    Test the full cycle: create a QR code, degrade the quality, and read it.

    Parameters
    ----------
    background_file : str
        Path to background image.
    index_length : int
        The number of bytes to use for the index in the smart contract.
    key_length : int
        The number of bytes to use for the decryption key.
    box_size : int
        The number of pixels to use for each box in the QR code.
    error_correction : int
        Determines the error correction level.
    border_color : str
        The color to use for the border encoded as RGB hex string
    quality : int
        JPEG quality setting.
    scale_to : (int, int)
        Target size to scale to when degrading image as (width, height).
    do_preprocess : bool
        Whether preprocessing should be applied.

    Returns
    -------
    (bool, float)
        (Whether the code could be read, time in seconds for reading)
    """
    # read background image from file
    background = Image.open(background_file)

    # generate random data and QR code with that data
    original_data = generate_qr_data(index_length=index_length, key_length=key_length)
    qr_img = generate_qr_code(
        data=original_data,
        box_size=box_size,
        quiet_zone_size=QUIET_ZONE_SIZES,
        error_correction=error_correction,
        border_color=border_color,
    )
    bg_with_qr = add_qr_code_to_background(background, qr_img)

    # degrade image quality
    bg_file_name_no_extension = Path(background_file).stem
    filename = (
        bg_file_name_no_extension
        + "_bs_"
        + str(box_size)
        + "_ec_"
        + qr_ec_level_to_str(error_correction)
        + "_bc_"
        + border_color[1:]
    )
    degraded_file = degrade_scale_image(
        bg_with_qr, quality=quality, size=scale_to, filename=filename
    )

    # try to read image and take time
    start_time = timer()
    degraded = cv2.imread(degraded_file, cv2.IMREAD_GRAYSCALE)
    if do_preprocess:
        preprocessed = preprocess_image(degraded)
    else:
        preprocessed = degraded

    read_data = read_qr_code(preprocessed)
    delta_time = timer() - start_time

    return (read_data == original_data, delta_time)


def main():
    """Run the configured tests."""
    # ensure image_directory exists
    Path(IMAGE_DIR).mkdir(parents=True, exist_ok=True)

    for (bg, bc) in itertools.product(BACKGROUNDS, BORDER_COLORS):
        print("Background: " + bg + ", border color: " + bc)
        results_table = []

        for (box_size, ec, quality, size) in itertools.product(
            BOX_SIZES, EC_LEVELS, JPEG_QUALITIES, SIZES
        ):
            for do_preprocess in [True, False]:
                successes = 0
                total_time = 0.0
                for _ in range(NUM_ITERATIONS):
                    (success, time) = create_and_read(
                        bg,
                        INDEX_LENGTH,
                        KEY_LENGTH,
                        box_size,
                        ec,
                        bc,
                        quality,
                        size,
                        do_preprocess,
                    )
                    if success:
                        successes += 1
                    total_time += time

                success_rate = successes / NUM_ITERATIONS
                avg_time = total_time / NUM_ITERATIONS
                table_row = [
                    box_size,
                    qr_ec_level_to_str(ec),
                    quality,
                    size,
                    do_preprocess,
                    success_rate,
                    avg_time,
                ]
                results_table.append(table_row)

        print(
            tabulate(
                results_table,
                headers=[
                    "box size",
                    "EC Level",
                    "JPEG quality",
                    "downsized to",
                    "pre-processing",
                    "success rate",
                    "average time to read",
                ],
            )
        )
        print()


if __name__ == "__main__":
    main()
