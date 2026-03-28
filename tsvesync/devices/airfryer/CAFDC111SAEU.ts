import BasicAirFryer from "../../lib/BasicAirFryer";

export default class CAFDC111SAEU extends BasicAirFryer {
    static deviceModels = ['CAF-DC111S-AEU'];
    static methods = ['getAirfryerMultiStatus', 'getPresetRecipe', 'startMultiCook', 'endCook', 'setTempUnit'];
    static recipeMeta = {
        AirFry: {recipeId: 14, recipeName: 'Air Fry', recipeType: 3},
        Bake: {recipeId: 9, recipeName: 'Bake', recipeType: 3},
        Roast: {recipeId: 13, recipeName: 'Roast', recipeType: 3},
        Grill: {recipeId: 20, recipeName: 'Grill', recipeType: 3},
        Reheat: {recipeId: 16, recipeName: 'Reheat', recipeType: 3},
        Dry: {recipeId: 21, recipeName: 'Dry', recipeType: 3},
        Proof: {recipeId: 27, recipeName: 'Proof', recipeType: 3},
    };
}
