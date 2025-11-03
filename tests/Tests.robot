*** Settings ***
Library           Browser
Resource          resource.resource
Suite Setup       Open Browser To App
Suite Teardown    Close Browser

*** Test Cases ***
Test Complete Matchday loading
    [Tags]             Regression
    [Documentation]    Matchday loads completely
    Select UCFL League
    Get Matchday Count
    Should Be Equal As Integers    ${MATCH_COUNT}    18

League Table Updates Correctly
    [Tags]             Regression
    [Documentation]    Ensure table displays correct data after prediction
    Select UCFL League
    Fill Predictions With Random Scores
    Click Next Button
    Take Screenshot

Full Prediction Flow Test
    [Tags]             Regression
    [Documentation]    Test the complete prediction flow for UCFL
    Select UCFL League
    UCFL Prediction Flow
    Verify Final Table

Back Button Test
    [Tags]             Unit
    [Documentation]    Verify that the Back button returns to the previous matchday
    Select UCFL League
    ${initial_matchday}=    Get Text    xpath=//h5[contains(@class, 'MuiTypography-h5')]
    Fill Predictions With Random Scores
    Click Next Button
    Sleep    2s
    ${next_matchday}=    Get Text    xpath=//h5[contains(@class, 'MuiTypography-h5')]
    Click    xpath=//button[contains(., 'Back')]
    Sleep    2s
    Wait For Elements State    xpath=//h5[contains(@class, 'MuiTypography-h5')]    visible
    ${after_back_matchday}=    Get Text    xpath=//h5[contains(@class, 'MuiTypography-h5')]
    Should Not Be Equal As Strings    ${next_matchday}    ${after_back_matchday}    
    Should Be Equal As Strings        ${after_back_matchday}    ${initial_matchday}    

PDF Download Button After Prediction
    [Tags]             Unit
    [Documentation]    Test PDF generation & download after submission
    Select UCFL League
    UCFL Prediction Flow
    Click    xpath=//button[contains(., 'Download PDF')]
    Sleep    2s
    Take Screenshot

Test Predict Again Button
    [Tags]             Unit
    [Documentation]    Test the reset functionality
    Select UCFL League
    UCFL Prediction Flow
    Click    xpath=//button[contains(., 'Predict Again')]
    Sleep    2s
    Wait For Elements State    css=.MuiBox-root    visible
    Take Screenshot