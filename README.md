# Watson assistant chat interface

Built using watston simple assistant api (nodejs sdk): (https://github.com/watson-developer-cloud/assistant-simple).

**Currently in Beta - This was developed as a proof of concept and is under development**

## Getting Started

1. In the application folder, copy the *.env.example* file and create a file called *.env*

       ```
       cp .env.example .env
       ```
2. Open the *.env* file and add the service credentials that you obtained in the previous step. The Watson SDK automaticaly locates the correct enviromental variables for either `username`, `password`, and `url` or the `apikey` and `url` credentials found in the *.env* file.

3. Add the `WORKSPACE_ID` to the previous properties

       ```
       WORKSPACE_ID=522be-7b41-ab44-dec3-g1eab2ha73c6
       ```

## Running locally

1. Install the dependencies

    ```
    npm install
    ```

1. Run the application

    ```
    npm start
    ```

1. Build application

    ```
    npm build
    ```

## Deploying to IBM Cloud as a Cloud Foundry Application

1. Login to IBM Cloud with the [IBM Cloud CLI](https://console.bluemix.net/docs/cli/index.html#overview)

    ```
    ibmcloud login
    ```

1. Target a Cloud Foundry organization and space.

    ```
    ibmcloud target --cf
    ```

1. Edit the *manifest.yml* file. Change the **name** field to something unique.
  For example, `- name: my-app-name`.
1. Deploy the application

    ```
    ibmcloud app push
    ```

1. View the application online at the app URL.
For example: https://my-app-name.mybluemix.net


## License

This sample code is licensed under Apache 2.0.
Full license text is available in [LICENSE](LICENSE).