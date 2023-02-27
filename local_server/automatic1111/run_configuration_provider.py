import random
from typing import Optional, List, Tuple

from pydantic import BaseModel

from automatic1111.models import GenerateImageRunConfiguration
from utils.exceptions import bad_request


def randrange(start: float, stop: float, step: float) -> float:
    return random.randrange(start=int(start * 100), stop=int(stop * 100), step=int(step * 100)) / 100


class RunConfigurationProvider:
    """
    Class that applies certain heuristic based on personal experience on generating automatic
    CFG scale and denoising strength values for new users that don't know what they want or for
    experienced users that just want to try a range of different values
    """

    @staticmethod
    def get_auto_cfg_scales(image_count: int) -> List[float]:
        """
        Try different CFG scales semi-randomly, but for smaller image counts make sure
        the values stay closer to something that seems to make sense
        This heuristic is far from optimal and may change
        """
        if image_count < 1:
            raise bad_request(f"Can't generate {image_count} images")
        if image_count == 1:
            # 7-9 seems ok for most models
            return [randrange(start=7, stop=9.5, step=0.5)]
        if image_count == 2:
            # can try a wider range now
            return [
                randrange(start=7, stop=9, step=0.5),
                randrange(start=9, stop=10.5, step=0.5),
            ]
        if 3 <= image_count <= 9:
            # pick one data point from each range 7-9, 9-11, ..., 23-25
            ranges = []
            for i in range(image_count):
                start = 7 + 2 * i
                stop = 9 + 2 * i
                ranges.append(randrange(start=start, stop=stop, step=0.5))
            return ranges

        # For that many images let's just come up with random CFG. Better use beta distribution because
        # uniform will give too many 20-something values that seem to produce results that are too distorted
        # Still, give some spread to beta distribution
        return sorted(list(map(
            lambda l: int((random.betavariate(alpha=2.3, beta=4) * 29 + 1) * 2) / 2,
            range(image_count),
        )))

    @staticmethod
    def get_auto_denoising_strengths(image_count: int) -> List[float]:
        """
        Try different denoising strengths semi-randomly, but for smaller image counts make sure
        the values stay closer to something that seems to make sense
        This heuristic is far from optimal and may change
        """
        if image_count < 1:
            raise bad_request(f"Can't generate {image_count} images")
        if image_count == 1:
            # Just what seems to work best
            return [
                randrange(start=0.65, stop=0.86, step=0.01),
            ]
        if image_count == 2:
            # One lower DS and one higher
            return [
                randrange(start=0.35, stop=0.56, step=0.01),
                randrange(start=0.65, stop=0.86, step=0.01),
            ]
        if image_count == 3:
            # One lower DS, one higher and one middle
            return [
                randrange(start=0.25, stop=0.46, step=0.01),
                randrange(start=0.45, stop=0.66, step=0.01),
                randrange(start=0.65, stop=0.86, step=0.01),
            ]
        if image_count == 4:
            # Let's bring DS closer to extreme values
            return [
                randrange(start=0.20, stop=0.41, step=0.01),
                randrange(start=0.40, stop=0.61, step=0.01),
                randrange(start=0.60, stop=0.76, step=0.01),
                randrange(start=0.75, stop=0.96, step=0.01),
            ]
        if image_count == 5:
            # Keep moving in that direction
            return [
                randrange(start=0.20, stop=0.41, step=0.01),
                randrange(start=0.40, stop=0.61, step=0.01),
                randrange(start=0.60, stop=0.76, step=0.01),
                randrange(start=0.75, stop=0.86, step=0.01),
                randrange(start=0.85, stop=0.96, step=0.01),
            ]
        if image_count == 6:
            return [
                randrange(start=0.20, stop=0.36, step=0.01),
                randrange(start=0.35, stop=0.51, step=0.01),
                randrange(start=0.50, stop=0.66, step=0.01),
                randrange(start=0.65, stop=0.81, step=0.01),
                randrange(start=0.75, stop=0.91, step=0.01),
                randrange(start=0.85, stop=0.96, step=0.01),
            ]
        # For that many images let's just come up with random DS. Uniform distribution should be fine here
        # since most DS values can be reasonable depending on the context
        return sorted(list(map(lambda l: randrange(start=0.15, stop=0.99, step=0.01), range(image_count))))

    @staticmethod
    def get_auto_cfg_scales_and_denoising_strengths(image_count: int) -> List[Tuple[float, float]]:
        """
        Try different CFG scales and denoising strengths semi-randomly, but keep randomly increasing both
        CFG scale and denoising strength, while giving more weight to different denoising strength values
        without bringing CFG scale too much to its extremes
        The logic here is that larger CFG scale makes the prompt stronger, and larger denoising strength
        brings the image closer to the prompt as well (by putting less weight on the original image)
        This heuristic is far from optimal and may change
        """
        if image_count < 1:
            raise bad_request(f"Can't generate {image_count} images")
        if image_count == 1:
            # Just what seems to work best
            return [
                (randrange(start=7, stop=9.5, step=0.5), randrange(start=0.65, stop=0.86, step=0.01)),
            ]
        if image_count == 2:
            # One lower DS and one higher; CFG scale around standard
            return [
                (randrange(start=7, stop=9.5, step=0.5), randrange(start=0.35, stop=0.56, step=0.01)),
                (randrange(start=7, stop=9.5, step=0.5), randrange(start=0.65, stop=0.86, step=0.01)),
            ]
        if image_count == 3:
            # One lower DS, one higher and one middle; CFG scale around standard
            return [
                (randrange(start=7, stop=9.5, step=0.5), randrange(start=0.25, stop=0.46, step=0.01)),
                (randrange(start=7, stop=9.5, step=0.5), randrange(start=0.45, stop=0.66, step=0.01)),
                (randrange(start=7, stop=9.5, step=0.5), randrange(start=0.65, stop=0.86, step=0.01)),
            ]
        if image_count == 4:
            # Let's bring DS closer to extreme values, move CFG scale a bit too
            return [
                (randrange(start=7, stop=9.5, step=0.5), randrange(start=0.20, stop=0.41, step=0.01)),
                (randrange(start=8, stop=10.5, step=0.5), randrange(start=0.40, stop=0.61, step=0.01)),
                (randrange(start=9, stop=11.5, step=0.5), randrange(start=0.60, stop=0.76, step=0.01)),
                (randrange(start=11, stop=13.5, step=0.5), randrange(start=0.75, stop=0.96, step=0.01)),
            ]
        if image_count == 5:
            # Keep moving in that direction
            return [
                (randrange(start=7, stop=9.5, step=0.5), randrange(start=0.20, stop=0.41, step=0.01)),
                (randrange(start=8, stop=10.5, step=0.5), randrange(start=0.40, stop=0.61, step=0.01)),
                (randrange(start=9, stop=11.5, step=0.5), randrange(start=0.60, stop=0.76, step=0.01)),
                (randrange(start=10, stop=12.5, step=0.5), randrange(start=0.75, stop=0.86, step=0.01)),
                (randrange(start=11, stop=13.5, step=0.5), randrange(start=0.85, stop=0.96, step=0.01)),
            ]
        if image_count == 6:
            return [
                (randrange(start=7, stop=9.5, step=0.5), randrange(start=0.20, stop=0.36, step=0.01)),
                (randrange(start=8, stop=10.5, step=0.5), randrange(start=0.35, stop=0.51, step=0.01)),
                (randrange(start=9, stop=11.5, step=0.5), randrange(start=0.50, stop=0.66, step=0.01)),
                (randrange(start=10, stop=12.5, step=0.5), randrange(start=0.65, stop=0.81, step=0.01)),
                (randrange(start=11, stop=13.5, step=0.5), randrange(start=0.75, stop=0.91, step=0.01)),
                (randrange(start=12, stop=14.5, step=0.5), randrange(start=0.85, stop=0.96, step=0.01)),
            ]
        # For that many images let's just come up with random CFG/DS, sort them and pair with each other
        # Let's use beta distributions for both. If we use uniform, low CFG scale will be paired with
        # low DS (the latter has little effect), and high CFG scale will be paired with
        # high DS (the former makes images too distorted)
        # Try it online here https://keisan.casio.com/exec/system/1180573226
        cfg_scales = sorted(list(map(
            lambda l: int((random.betavariate(alpha=5, beta=12) * 29 + 1) * 2) / 2,
            range(image_count),
        )))
        denoising_strengths = sorted(list(map(
            lambda l: int(random.betavariate(alpha=4, beta=2) * 100) / 100,
            range(image_count),
        )))
        return list(zip(cfg_scales, denoising_strengths))

    def build_txt2img_run_configurations(
            self,
            image_count: int,
            requested_cfg_scale: Optional[float],
    ) -> List[GenerateImageRunConfiguration]:
        """
        :param image_count: how many images we are going to generate in total
        :param requested_cfg_scale: the requested CFG scale. None means it needs to be set automatically for each image
        :return: List of run configurations. Each can contain either a single image or multiple images in case
        when different images can share the same CFG scale
        """
        if requested_cfg_scale is not None:
            return [GenerateImageRunConfiguration(
                num_images=image_count,
                cfg_scale=requested_cfg_scale,
            )]
        cfg_scales = self.get_auto_cfg_scales(image_count)
        return list(map(
            lambda cfg_scale: GenerateImageRunConfiguration(
                num_images=1,
                cfg_scale=cfg_scale,
            ),
            cfg_scales
        ))

    def build_img2img_run_configurations(
            self,
            image_count: int,
            requested_cfg_scale: Optional[float],
            requested_denoising_strength: Optional[float],
    ) -> List[GenerateImageRunConfiguration]:
        """
        :param image_count: how many images we are going to generate in total
        :param requested_cfg_scale: the requested CFG scale. None means it needs to be set automatically for each image
        :param requested_denoising_strength: the requested DS. None means it needs to be set automatically for each image
        :return: List of run configurations. Each can contain either a single image or multiple images in case
        when different images can share the same CFG scale and/or denoising strength
        """
        if requested_cfg_scale is not None and requested_denoising_strength is not None:
            return [GenerateImageRunConfiguration(
                num_images=image_count,
                cfg_scale=requested_cfg_scale,
                denoising_strength=requested_denoising_strength,
            )]

        if requested_cfg_scale is not None and requested_denoising_strength is None:
            denoising_strengths = self.get_auto_denoising_strengths(image_count)
            list(map(
                lambda denoising_strength: GenerateImageRunConfiguration(
                    num_images=1,
                    cfg_scale=requested_cfg_scale,
                    denoising_strength=denoising_strength,
                ),
                denoising_strengths
            ))

        if requested_cfg_scale is None and requested_denoising_strength is not None:
            cfg_scales = self.get_auto_cfg_scales(image_count)
            return list(map(
                lambda cfg_scale: GenerateImageRunConfiguration(
                    num_images=1,
                    cfg_scale=cfg_scale,
                    denoising_strength=requested_denoising_strength,
                ),
                cfg_scales
            ))

        cfg_scales_and_denoising_strengths = self.get_auto_cfg_scales_and_denoising_strengths(image_count)
        return list(map(
            lambda cfg_scale_and_denoising_strength: GenerateImageRunConfiguration(
                num_images=1,
                cfg_scale=cfg_scale_and_denoising_strength[0],
                denoising_strength=cfg_scale_and_denoising_strength[1],
            ),
            cfg_scales_and_denoising_strengths
        ))


run_configuration_provider = RunConfigurationProvider()


if __name__ == "__main__":
    print("CFG Scale:")
    print(1, run_configuration_provider.get_auto_cfg_scales(1))
    print(2, run_configuration_provider.get_auto_cfg_scales(2))
    print(3, run_configuration_provider.get_auto_cfg_scales(3))
    print(4, run_configuration_provider.get_auto_cfg_scales(4))
    print(5, run_configuration_provider.get_auto_cfg_scales(5))
    print(6, run_configuration_provider.get_auto_cfg_scales(6))
    print(7, run_configuration_provider.get_auto_cfg_scales(7))
    print(8, run_configuration_provider.get_auto_cfg_scales(8))
    print(9, run_configuration_provider.get_auto_cfg_scales(9))
    print(10, run_configuration_provider.get_auto_cfg_scales(10))
    print(11, run_configuration_provider.get_auto_cfg_scales(11))
    print(12, run_configuration_provider.get_auto_cfg_scales(12))
    print("Denoising Strengths:")
    print(1, run_configuration_provider.get_auto_denoising_strengths(1))
    print(2, run_configuration_provider.get_auto_denoising_strengths(2))
    print(3, run_configuration_provider.get_auto_denoising_strengths(3))
    print(4, run_configuration_provider.get_auto_denoising_strengths(4))
    print(5, run_configuration_provider.get_auto_denoising_strengths(5))
    print(6, run_configuration_provider.get_auto_denoising_strengths(6))
    print(7, run_configuration_provider.get_auto_denoising_strengths(7))
    print(8, run_configuration_provider.get_auto_denoising_strengths(8))
    print(9, run_configuration_provider.get_auto_denoising_strengths(9))
    print(10, run_configuration_provider.get_auto_denoising_strengths(10))
    print(11, run_configuration_provider.get_auto_denoising_strengths(11))
    print(12, run_configuration_provider.get_auto_denoising_strengths(12))
    print("CFG Scale and Denoising Strengths:")
    print(1, run_configuration_provider.get_auto_cfg_scales_and_denoising_strengths(1))
    print(2, run_configuration_provider.get_auto_cfg_scales_and_denoising_strengths(2))
    print(3, run_configuration_provider.get_auto_cfg_scales_and_denoising_strengths(3))
    print(4, run_configuration_provider.get_auto_cfg_scales_and_denoising_strengths(4))
    print(5, run_configuration_provider.get_auto_cfg_scales_and_denoising_strengths(5))
    print(6, run_configuration_provider.get_auto_cfg_scales_and_denoising_strengths(6))
    print(7, run_configuration_provider.get_auto_cfg_scales_and_denoising_strengths(7))
    print(8, run_configuration_provider.get_auto_cfg_scales_and_denoising_strengths(8))
    print(9, run_configuration_provider.get_auto_cfg_scales_and_denoising_strengths(9))
    print(10, run_configuration_provider.get_auto_cfg_scales_and_denoising_strengths(10))
    print(11, run_configuration_provider.get_auto_cfg_scales_and_denoising_strengths(11))
    print(12, run_configuration_provider.get_auto_cfg_scales_and_denoising_strengths(12))
