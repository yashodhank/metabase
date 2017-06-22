import {
    login,
    startServer,
    stopServer,
    globalReduxStore as store,
    globalBrowserHistory as history,
    getAppContainer
} from "metabase/__support__/integrated_tests";
import { refreshSiteSettings } from "metabase/redux/settings";
import { initializeSettings } from "metabase/admin/settings/settings";
import { mount } from "enzyme";
import { loadCurrentUser } from "metabase/redux/user";
import { createWaitForElement } from 'enzyme-wait';

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("admin/settings", () => {
    const appContainer = getAppContainer();

    beforeAll(async () => {
        await startServer();
        await login();
    })

    afterAll(async () => {
        await stopServer();
    })

    describe("admin settings", () => {
        it("should persist a setting", async () => {
            await store.dispatch(refreshSiteSettings());
            // // do all needed metadata loading before the page push
            await initializeSettings();
            await loadCurrentUser();

            // pick a random site name to try updating it to
            const siteName = "Metabase" + Math.random();

            // load the "general" pane of the admin settings
            history.push('/admin/settings/general');

            // first just make sure the site name isn't already set (it shouldn't since we're using a random name)
            const appWrapper = mount(appContainer)
            const waitFor = (selector) => createWaitForElement(selector, 10000)(appWrapper);

            const input = appWrapper.find(".SettingsInput").first()

            expect(input.prop("value")).not.toBe(siteName);

            // update the field value, then blur to trigger the update
            input.simulate('change', { target: { value: siteName } })
            input.simulate('blur')

            // wait for the loading indicator to show success
            // TODO: Is this the best way to "wait" in Enzyme tests for our needs?
            // await waitFor(".SettingsInput");
            await timeout(3000);

            // see if the value is persisted still after page change
            history.push("/");
            history.push("/admin/settings/general");

            // verify the site name value was persisted
            expect(appWrapper.find(".SettingsInput").first().prop("value")).toBe(siteName);
        });
    });
});
