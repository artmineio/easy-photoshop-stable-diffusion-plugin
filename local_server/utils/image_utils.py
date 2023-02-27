import base64
import math
import re
import time
from io import BytesIO
from typing import Tuple, Optional

import cv2
import numpy as np
from PIL import Image

from automatic1111.models import SelectionArea
from utils.constants import THUMBNAIL_IMAGE_WIDTH, OUTPUT_FOLDER_PATH
from utils.exceptions import server_error, bad_request

# How much larger the selection area would be than the corresponding mask
MASK_IMAGE_AREA_EXPAND_FACTOR = 1.5


def pil_image_to_base64_string(pil_image):
    image_buffer = BytesIO()
    pil_image.save(image_buffer, format="PNG")
    return base64.b64encode(image_buffer.getvalue())


def base64_string_to_pil_image2(base64_string):
    return Image.open(BytesIO(base64.b64decode(base64_string)))


def cv2_image_to_base64_string(cv2_image):
    return base64.b64encode(cv2.imencode('.png', cv2_image)[1]).decode()


def base64_string_to_cv2_image(base64_string):
    # encoded_data = base64_string.split(',')[1]
    encoded_data = base64_string
    image_array = np.fromstring(base64.b64decode(encoded_data), np.uint8)
    return cv2.imdecode(image_array, cv2.IMREAD_COLOR)


def base64_string_to_pil_image(base64_string):
    image_data = re.sub('^data:image/.+;base64,', '', base64_string)
    return Image.open(BytesIO(base64.b64decode(image_data)))
    # image_data = re.sub('^data:image/.+;base64,', '', base64_string).decode('base64')
    # return Image.open(StringIO(image_data))


def pil_image_to_ndarray(image: Image.Image) -> np.ndarray:
    # return np.array(image)
    return np.asarray(image)


def ndarray_to_pil_image(image):
    return Image.fromarray(image)


STABLE_DIFFUSION_IMAGE_DIMENSION = 512
MAX_DIMENSION = 2048
BLOCK_SIZE = 8
# BLOCK_SIZE = 64


def extract_image_from_selection_and_scale(
        image: np.ndarray,
        selection_area: SelectionArea,
) -> Tuple[np.ndarray, float]:
    """
    Take the part of the image that is selected and scale it to the size appropriate to stable diffusion preserving
    the aspect ratio.
    Make sure to do generation with at least 512 dimension, otherwise the results don't seem too good on neither small
    nor large images. Pick the size as close to the selection dimensions as possible, scale smaller dimension down/up
    to 512 and larger dimension accordingly. Make sure the final dimensions are divisible by the block size
    :param image: the image that is of the size of the document. That is, if source or mask layers only take part
    of the document, image should contain them placed appropriately to what the user saw
    :param selection_area:
    :return:
    """
    image_height = image.shape[0]
    image_width = image.shape[1]

    selection_x = max(selection_area.x, 0)
    selection_y = max(selection_area.y, 0)
    selection_width = min(selection_area.width, image_width - selection_area.x)
    selection_height = min(selection_area.height, image_height - selection_area.y)
    selection_x2 = selection_x + selection_width
    selection_y2 = selection_y + selection_height

    cropped_image = image[selection_y: selection_y2, selection_x: selection_x2, :]
    # cv2.imwrite(f"E:\\Temp\\test1_cropped_{name}.png", cropped_image)

    is_image_wide = selection_width >= selection_height
    smaller_dimension = selection_height if is_image_wide else selection_width
    larger_dimension = selection_width if is_image_wide else selection_height

    # We want to scale image so that smaller dimension is 512 and larger dimension is whatever it is
    scale_factor = STABLE_DIFFUSION_IMAGE_DIMENSION / smaller_dimension
    # In case of a rounding error let's round up so that it stays a larger dimension
    scaled_larger_dimension = math.ceil(larger_dimension * scale_factor)

    scaled_width = scaled_larger_dimension if is_image_wide else STABLE_DIFFUSION_IMAGE_DIMENSION
    scaled_height = STABLE_DIFFUSION_IMAGE_DIMENSION if is_image_wide else scaled_larger_dimension

    scaled_image = cv2.resize(
        cropped_image,
        dsize=[scaled_width, scaled_height],
        fx=scale_factor,
        fy=scale_factor,
        interpolation=cv2.INTER_CUBIC,
    )

    # Crop scaled image down to the nearest block size. In theory even 512 after scaling may become 511 and scale down
    # TODO: is this needed at all? This is mostly for compatibility with Automatic1111 UI but it might be redundant
    scaled_image_crop_height = (scaled_image.shape[0] // BLOCK_SIZE) * BLOCK_SIZE
    scaled_image_crop_width = (scaled_image.shape[1] // BLOCK_SIZE) * BLOCK_SIZE

    # Crop the scaled image but keep the top-left corner intact, because when pasting the image we will be aligning
    # it in the top-left corner as well. With sufficiently small block size the cut-out pixels should not matter to user
    scaled_cropped_image = scaled_image[:scaled_image_crop_height, :scaled_image_crop_width, :]
    return scaled_cropped_image, scale_factor


# TODO: merge this method with the above one
def get_scale_factor(selection_area: SelectionArea) -> Tuple[int, int, float]:
    """
    This method find smaller dimension of the selection area and returns a scale factor that would convert it to 512
    """
    selection_width = selection_area.width
    selection_height = selection_area.height

    is_image_wide = selection_width >= selection_height
    smaller_dimension = selection_height if is_image_wide else selection_width
    larger_dimension = selection_width if is_image_wide else selection_height

    # We want to scale image so that smaller dimension is 512 and larger dimension is whatever it is
    scale_factor = STABLE_DIFFUSION_IMAGE_DIMENSION / smaller_dimension
    # In case of a rounding error let's round up so that it stays a larger dimension
    scaled_larger_dimension = math.ceil(larger_dimension * scale_factor)

    scaled_width = scaled_larger_dimension if is_image_wide else STABLE_DIFFUSION_IMAGE_DIMENSION
    scaled_height = STABLE_DIFFUSION_IMAGE_DIMENSION if is_image_wide else scaled_larger_dimension

    # TODO: Do we need the division by BLOCK_SIZE at all? Does it impact the results? It's taken from the automatic1111
    # UI but maybe it's there just for UX? Do we need to maintain this compatibility?
    scaled_width_crop = (scaled_width // BLOCK_SIZE) * BLOCK_SIZE
    scaled_height_crop = (scaled_height // BLOCK_SIZE) * BLOCK_SIZE
    return scaled_width_crop, scaled_height_crop, scale_factor


def paste_image_onto_selection_in_new_image(
        document_width: int,
        document_height: int,
        image_to_paste: np.ndarray,
        selection_area: SelectionArea,
        scale_factor: Optional[float],
) -> np.ndarray:
    """
    Paste the generated image back onto the selection area in the original image but on a new RGBA image
    so that Photoshop can import this image as a layer as-is
    """
    # New image is 4-channel RGBA, fully transparent to start
    new_image = np.zeros((document_height, document_width, 4), dtype=np.uint8)

    if scale_factor is not None:
        # Inverted scale factor to paste the image back in case of img2img
        new_scale_factor = 1. / scale_factor
        scaled_height = round(image_to_paste.shape[0] * new_scale_factor)
        scaled_width = round(image_to_paste.shape[1] * new_scale_factor)
        maybe_scaled_image = cv2.resize(
            image_to_paste,
            dsize=[scaled_width, scaled_height],
            fx=new_scale_factor,
            fy=new_scale_factor,
            interpolation=cv2.INTER_CUBIC,
        )
    else:
        # No scaling is necessary, just paste
        maybe_scaled_image = image_to_paste

    paste_x = selection_area.x
    paste_y = selection_area.y
    available_width = new_image.shape[1] - selection_area.x
    available_height = new_image.shape[0] - selection_area.y
    paste_width = min(maybe_scaled_image.shape[1], available_width)
    paste_height = min(maybe_scaled_image.shape[0], available_height)
    # Paste all of the color channels of the generated image within the available area
    new_image[paste_y:paste_y+paste_height, paste_x:paste_x+paste_width, :3] = \
        maybe_scaled_image[:paste_height, :paste_width, :3]
    # Set the alpha channel to fully opaque for the image region
    # TODO: BUG: set alpha channel to that of the source image so that we can generate on transparent layers
    # (I think the below should do it)
    if maybe_scaled_image.shape[2] >= 4:
        new_image[paste_y:paste_y+paste_height, paste_x:paste_x+paste_width, 3] = \
            maybe_scaled_image[:paste_height, :paste_width, 3]
    else:
        new_image[paste_y:paste_y+paste_height, paste_x:paste_x+paste_width, 3] = 255
    return new_image


def read_image_as_full_sized_layer(
        document_width: int,
        document_height: int,
        image_file_path: str,
        image_x: int,
        image_y: int,
        layer_description: str,
) -> Tuple[np.ndarray, SelectionArea]:
    """
    When exporting PNGs, Photoshop crops them down to their non-transparent pixels. For our purposes it's
    more convenient to work with a full image (be it source or mask) corresponding to what the user saw on the screen
    This method should read such image as if it was exported by Photoshop as a full-sized layer
    :param document_width: full Photoshop document width
    :param document_height: full Photoshop document height
    :param image_file_path: full image file name path
    :param image_x: x coordinate of the smallest rectangle containing all non-transparent pixels
    :param image_y: y coordinate of the smallest rectangle containing all non-transparent pixels
    :return: full-sized image
    """
    maybe_cropped_image = cv2.imread(image_file_path, flags=cv2.IMREAD_UNCHANGED)
    if maybe_cropped_image is None:
        # This is a hacky retry in case photoshop was not able to export the image yet
        # TODO: fix proper retries
        time.sleep(3)
        maybe_cropped_image = cv2.imread(image_file_path, flags=cv2.IMREAD_UNCHANGED)
        if maybe_cropped_image is None:
            # This can happen if the corresponding layer was empty. Photoshop does not export empty PNGs
            raise bad_request(f"Cannot load the image. Please make sure your {layer_description} is not empty!")

    # Let's record the area of the image that is not transparent so that we know when it intersects with users
    # selection
    non_transparent_pixels_area = SelectionArea(
        # In case if x or y are negative, it means that Photoshop layer actually went beyond the visible document area
        # However, Photoshop would export only the visible part of the layer, so we should treat x and y as 0
        x=max(image_x, 0),
        y=max(image_y, 0),
        width=maybe_cropped_image.shape[1],
        height=maybe_cropped_image.shape[0],
    )
    new_image = paste_image_onto_selection_in_new_image(
        document_width=document_width,
        document_height=document_height,
        image_to_paste=maybe_cropped_image,
        selection_area=non_transparent_pixels_area,
        scale_factor=None,
    )
    return new_image, non_transparent_pixels_area


def get_image_thumbnail(generated_image: np.ndarray) -> np.ndarray:
    """
    Generate thumbnail image and fit to width
    """
    thumb_scale_factor = THUMBNAIL_IMAGE_WIDTH / generated_image.shape[1]
    thumb_height = round(generated_image.shape[0] * thumb_scale_factor)
    thumb_width = round(generated_image.shape[1] * thumb_scale_factor)
    return cv2.resize(
        generated_image,
        dsize=[thumb_width, thumb_height],
        fx=thumb_scale_factor,
        fy=thumb_scale_factor,
        interpolation=cv2.INTER_CUBIC,
    )


def convert_mask_image(mask_image: np.ndarray) -> np.ndarray:
    """
    Convert the mask image painted by the user to the mask image understood by Automatic1111 Stable Diffusion
    """
    mask_alpha_channel = mask_image[:, :, 3]
    black_and_white_mask = np.stack([mask_alpha_channel, mask_alpha_channel, mask_alpha_channel], axis=2)
    return black_and_white_mask


def expand_mask_area(mask_image_area: SelectionArea) -> SelectionArea:
    # Expand the area around mask by a certain factor. It's ok if the resulting area goes beyond the document dimensions
    width = int(mask_image_area.width * MASK_IMAGE_AREA_EXPAND_FACTOR)
    height = int(mask_image_area.height * MASK_IMAGE_AREA_EXPAND_FACTOR)
    added_half_width = (width - mask_image_area.width) // 2
    added_half_height = (height - mask_image_area.height) // 2
    return SelectionArea(
        x=mask_image_area.x - added_half_width,
        y=mask_image_area.y - added_half_height,
        width=width,
        height=height,
    )


def areas_intersect(area1, area2):
    area1_x2 = area1.x + area1.width
    area1_y2 = area1.y + area1.height
    area2_x2 = area2.x + area2.width
    area2_y2 = area2.y + area2.height

    intersection_x = max(area1.x, area2.x)
    intersection_y = max(area1.y, area2.y)
    intersection_x2 = min(area1_x2, area2_x2)
    intersection_y2 = min(area1_y2, area2_y2)
    intersection_width = intersection_x2 - intersection_x
    intersection_height = intersection_y2 - intersection_y
    return intersection_width > 0 and intersection_height > 0


def adjust_selection_area(
        user_input_selection_area: Optional[SelectionArea],
        source_image_area: Optional[SelectionArea],
        mask_image_area: Optional[SelectionArea],
        document_width: int,
        document_height: int,
):
    """
    Make sure selection area is within image and within the source image area if present
    If selection area is missing, create one
    """
    # First define the selection if it's not given by the user
    if user_input_selection_area is not None:
        selection_area = user_input_selection_area
    else:
        if mask_image_area is not None:
            # If there is a mask, take a larger area around it
            selection_area = expand_mask_area(mask_image_area)
        else:
            # If there is no mask, we just use the full document area
            selection_area = SelectionArea(
                x=0,
                y=0,
                width=document_width,
                height=document_height,
            )

    # Adjust the selection so that it does not go beyond the document
    selection_x2 = selection_area.x + selection_area.width
    selection_y2 = selection_area.y + selection_area.height
    x = max(selection_area.x, 0)
    y = max(selection_area.y, 0)
    x2 = min(selection_x2, document_width)
    y2 = min(selection_y2, document_height)
    selection_area_within_document = SelectionArea(
        x=x,
        y=y,
        width=x2-x,
        height=y2-y,
    )

    if mask_image_area is not None:
        # Check that mask area intersects with source image area
        source_and_mask_intersect = areas_intersect(
            area1=mask_image_area,
            area2=source_image_area,
        )
        if not source_and_mask_intersect:
            raise bad_request(
                "Please make sure to paint something on your mask layer in the area of the picked source layer"
            )

        # Check that mask area intersects with selection area
        selection_and_mask_intersect = areas_intersect(
            area1=mask_image_area,
            area2=selection_area_within_document
        )
        if not selection_and_mask_intersect:
            # User selected the area outside of the painted mask
            raise bad_request("Please make sure to use Marquee tool to select an area around the painted mask region")

    if source_image_area is not None:
        # Check that selection area intersects with source image area
        selection_and_source_intersect = areas_intersect(
            area1=selection_area_within_document,
            area2=source_image_area,
        )
        if not selection_and_source_intersect:
            raise bad_request(
                "Please make sure to use Marquee tool to select an area around your picked source layer"
            )

        # If source image exists, make sure the selection does not go beyond that
        source_x2 = source_image_area.x + source_image_area.width
        source_y2 = source_image_area.y + source_image_area.height

        x = max(x, source_image_area.x)
        y = max(y, source_image_area.y)
        x2 = min(x2, source_x2)
        y2 = min(y2, source_y2)

    width = x2 - x
    height = y2 - y

    if width <= 0 or height <= 0:
        # There is no intersection between the selection area and source image. This shouldn't happen because
        # the above checks should be able to catch mismatch in positioning of source, mask and selection
        # Also, Photoshop does not export empty layers
        raise bad_request("Please make sure your selected area is within the visible document area")

    return SelectionArea(
        x=x,
        y=y,
        width=width,
        height=height,
    )
