import { Composition } from "remotion";
import { COMPARE_DURATION, Compare } from "./Compare";
import { IMR_DURATION, Imr } from "./Imr";
import { TBR_DURATION, Tbr } from "./Tbr";

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition id="IMR" component={Imr} durationInFrames={IMR_DURATION} fps={30} width={1920} height={1080} />
            <Composition id="TBR" component={Tbr} durationInFrames={TBR_DURATION} fps={30} width={1920} height={1080} />
            <Composition id="Compare" component={Compare} durationInFrames={COMPARE_DURATION} fps={30} width={1920} height={1080} />
        </>
    );
};
