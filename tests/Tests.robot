*** Settings ***
Library    SeleniumLibrary
Library    ./Keywords/BackendKeywords.py
Library    ./Keywords/FrontendKeywords.py
Library    ./Keywords/RegressionKeywords.py
Suite Setup    Open Browser To App
Suite Teardown    Close Browser

*** Variables ***
${BROWSER}    Chrome
${PDF_PATH}   ./test_output.pdf

*** Keywords ***
Open Browser To App
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window

Submit Prediction
    [Arguments]    ${team1_score}    ${team2_score}
    Input Text    id=team1-input    ${team1_score}
    Input Text    id=team2-input    ${team2_score}
    Click Button    id=submit-button

Download PDF
    Click Button    id=download-pdf

*** Test Cases ***
Prediction Calculation Test
    [Tags]             Unit
    [Documentation]    Test backend prediction logic
    Prediction Should Be Correct    2    1    Team1 Wins
    Prediction Should Be Correct    0    3    Team2 Wins
    Prediction Should Be Correct    1    1    Draw

Input Validation Test
    [Tags]             Unit
    [Documentation]    Validate inputs for backend functions
    Input Should Be Valid    valid_prediction_input
    Run Keyword And Expect Error    AssertionError    Input Should Be Valid    invalid_input

PDF Generation Test
    [Tags]             Unit
    [Documentation]    Test PDF generation logic in backend
    ${data}=    Create Dictionary    team1=Team1    team2=Team2    score=2-1
    Pdf Should Be Generated    ${data}    ${PDF_PATH}

Submit Prediction And Verify Backend
    [Tags]             Integration
    [Documentation]    Test frontend submission -> backend storage
    Submit Prediction    2    1
    Prediction Should Be Saved In Backend    Team1    Team2    2    1

PDF Download After Prediction
    [Tags]             Integration
    [Documentation]    Test PDF generation & download after submission
    Submit Prediction    3    2
    Download PDF
    File Should Exist    ${PDF_PATH}

Full User Workflow
    [Tags]             Integration
    [Documentation]    End-to-end test: submit prediction, verify table, backend, PDF
    Submit Prediction    1    1
    Prediction Should Be Saved In Backend    Team1    Team2    1    1
    Download PDF
    File Should Exist    ${PDF_PATH}

League Table Updates Correctly
    [Tags]             Regression
    [Documentation]    Ensure table displays correct data after prediction
    Submit Prediction    1    1
    Page Should Contain Text    ${BROWSER}    Team1
    Page Should Contain Text    ${BROWSER}    Team2

Invalid Input Shows Error
    [Tags]             Regression
    [Documentation]    Previously fixed bug: negative scores should show validation error
    Submit Prediction    -1    5
    Page Should Contain    Invalid input

Multiple Rounds Predictions
    [Tags]             Regression
    [Documentation]    Ensure multiple round predictions are handled correctly
    Submit Prediction    0    0
    Submit Prediction    2    2
    Prediction Should Be Saved In Backend    Team1    Team2    0    0
    Prediction Should Be Saved In Backend    Team1    Team2    2    2
