import * as db from './db_access.js'

export const FeatureFlagsKeys = {
    AcademyButtonsSeparation: "academyButtonsSeparation",
    MatchBadgeEnhancement: "matchBadgeEnhancement",
    LineupPageAdditions: "lineupPageAdditions",
    MatchDataGathering: "matchDataGathering",
    PlayerPageAdditions: "playerPageAdditions",
    PlayersPageAdditions: "playersPageAdditions",
    RowHighlighting: "rowHighlighting",
    TagsEnhancement: "tagsEnhancement"
};

export async function isFeatureEnabled(featureKey) {
    const features = await db.getFeatures()   
    return features[featureKey] === true;
}