import React, { useEffect, useState, useRef } from "react";
import Form from "react-bootstrap/Form";
import { useSelector, useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { Col, Container, Row, Spinner, Badge, Alert } from "react-bootstrap";
import { useForm } from "react-hook-form";
import {
  setFormData,
  fetchContract,
  fetchRequests,
  enterTX,
  notify,
  exitTX,
} from "../../redux/actions";
import { ethers } from "ethers";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import Button from "../custom/Button";
import styles from "./styles.module.scss";
import {
  usePrepareContractWrite,
  useAccount,
  useContractRead,
  useNetwork,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";

const FundCreateForm = (props) => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const dispatch = useDispatch();
  const history = useHistory();
  const [vaultIndex, SetVaultIndex] = useState(0);
  const [requestable, SetRequestable] = useState(false);
  const [allowedTokenAddresses, SetAllowedTokenAddresses] = useState([]);
  const [allowedVaultAddresses, SetAllowedVaultAddresses] = useState([]);
  const [jobs, SetJobs] = useState([]);
  const inTX = useSelector((state) => state.ui.transaction);
  const languageData = useSelector((state) => state.language.createFund);
  const chainId = useSelector((state) => state.account.chainId);
  const contracts = useSelector((state) => state.contracts);
  const currentAccount = useSelector((state) => state.account.account);

  const poolManagerContract = useSelector(
    (state) => state.contracts.PoolManager
  );

  const { theme } = useSelector((state) => state.theme);

  const schema = Yup.object().shape({
    fundName: Yup.string().required("Please enter a fund name").default(""),
    fundFocus: Yup.string().required("Please enter a fund focus").default(""),
    fundDescription: Yup.string()
      .required("Please enter a fund description")
      .default(""),
    vaultAddress: Yup.string()
      .required("Please enter a vault address")
      .default(""),
    jobName: Yup.string().default(""),
    jobId: Yup.string().default(""),
    isRequestable: Yup.boolean(),
    jobsArray: Yup.array()
      .default([])
      .when("isRequestable", {
        is: "true",
        then: Yup.array().required("Please enter at least 1 job."),
      }),
    recipient: Yup.string()
      .required("Please enter an address")
      .default(currentAccount),
    allowedToken: Yup.string().required("Please select a token").default(""),
    allowedTokenInput: Yup.string().default(""),
    allowedTokensArray: Yup.array()
      .min(1, "Please enter at least 1 token address")
      .required("Please enter at least 1 token address")
      .default([]),
    vaultThreshold: Yup.string().default(1),
    allowedVaultAddress: Yup.string()
      .required("Please select a vault")
      .default(""),
    allowedVaultAddresInput: Yup.string().default(""),
    allowedVaultsArray: Yup.array()
      .min(1, "Please enter at least 1 token address")
      .required("Please enter at least 1 token address")
      .default([]),
  });

  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    getValues,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const { config } = usePrepareContractWrite({
    address: poolManagerContract.address,
    abi: poolManagerContract.abi,
    functionName: "deployPool",
    chainId: chain?.id,
    enabled: true,
    args: [
      {
        name: getValues("fundName"),
        description: getValues("fundDescription"),
        feeRatio: parseInt(getValues("poolFeeRatio")),
        permittedAssets: getValues("allowedTokensArray"),
        vaultParameters: {
          owners: getValues("allowedVaultsArray"),
          threshold: parseInt(getValues("vaultThreshold")),
        },
      },
    ],
  });

  const { data, write } = useContractWrite(config);

  const { isLoading } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: () => console.log("TRUE"),
  });

  const vaultTypeChanged = (e) => {
    SetVaultIndex(e.target.value);
  };

  const changeSupportedNetwork = async () => {
    if (window.ethereum) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xA869" }], // ! For testing purposes - 43113 & For production - 43114
      });
    }
  };

  const addToAllowedTokens = (e) => {
    let allowedToken = getValues("allowedTokenInput");
    ethers.utils.isAddress(allowedToken);
    if (allowedToken == "0x") {
      allowedToken = ethers.constants.AddressZero;
    }
    if (
      allowedToken &&
      allowedTokenAddresses.indexOf(allowedToken) === -1
      // ! isAddress validation
    ) {
      SetAllowedTokenAddresses([...allowedTokenAddresses, allowedToken]);
      setValue("allowedTokenInput", "");
      setValue("allowedTokensArray", [...allowedTokenAddresses, allowedToken]);
    }
  };

  const addToVaultOwners = (e) => {
    const ownerAddress = getValues("allowedVaultAddresInput");
    ethers.utils.isAddress(ownerAddress);
    if (
      ownerAddress &&
      allowedVaultAddresses.indexOf(ownerAddress) === -1
      // ! isAddress validation
    ) {
      SetAllowedVaultAddresses([...allowedVaultAddresses, ownerAddress]);
      setValue("allowedVaultAddresInput", "");
      setValue("allowedVaultsArray", [...allowedVaultAddresses, ownerAddress]);
    }
  };

  const addToJobs = (e) => {
    const job = { name: getValues("jobName"), id: getValues("jobId") };
    if (job.name) {
      SetJobs([...jobs, job]);
      setValue("jobName", "");
      setValue("jobId", "");
      setValue("jobsArray", [...jobs, job]);
    }
  };

  const onClickRemoveAllowedToken = (allowedToken) => {
    const tmp = allowedTokenAddresses.filter((token) => token !== allowedToken);
    SetAllowedTokenAddresses(tmp);
    setValue("allowedTokensArray", tmp);
  };

  const onClickRemoveAllowedVault = (allowedVault) => {
    const tmp = allowedVaultAddresses.filter((token) => token !== allowedVault);
    SetAllowedVaultAddresses(tmp);
    setValue("allowedVaultsArray", tmp);
  };

  const onClickRemoveJob = (job) => {
    const tmp = jobs.filter((token) => token !== job);
    SetJobs(tmp);
    setValue("jobsArray", tmp);
  };

  const requestableChange = (e) => {
    SetRequestable(!requestable);
    setValue("isRequestable", !requestable);
    // change and try but should be correct
  };

  return (
    <>
      {chainId && chainId !== 43113 && (
        <Alert
          variant={"danger"}
          className="d-flex"
          onClick={changeSupportedNetwork}
        >
          <p
            className="mb-0 mx-auto text-center"
            style={{ fontSize: "1rem", cursor: "pointer" }}
          >
            Please change your network to Avalanche C-Chain
          </p>
        </Alert>
      )}
      <form className={styles.requestForm}>
        <Row className="justify-content-center">
          <Col lg={3} xs={5}>
            <label>{languageData.fundNameLabel}</label>
          </Col>
          <Col
            lg={9}
            xs={7}
            className="justify-content-center d-flex flex-column"
          >
            <input
              style={{ width: "100%", marginBottom: 0 }}
              {...register("fundName")}
              placeholder={languageData.fundNamePlaceholder}
            />
            {errors.fundName && (
              <p className="text-center mt-1">{errors.fundName.message}</p>
            )}
          </Col>
        </Row>
        <Row className="justify-content-center mt-3">
          <Col lg={3} xs={5}>
            <label>{languageData.descriptionLabel}</label>
          </Col>
          <Col
            lg={9}
            xs={7}
            className="justify-content-center d-flex flex-column"
          >
            <textarea
              {...register("fundDescription")}
              style={{ width: "100%", marginBottom: 0 }}
              type="textarea"
              rows={3}
              placeholder={languageData.descriptionPlaceholder}
            />
            {errors.fundDescription && (
              <p className="text-center mt-1">
                {errors.fundDescription.message}
              </p>
            )}
          </Col>
        </Row>
        <Row className="justify-content-center mt-3">
          <Col lg={3} xs={5}>
            <label>{languageData.poolFeeRatio}</label>
          </Col>
          <Col
            lg={9}
            xs={7}
            className="justify-content-center d-flex flex-column"
          >
            <input
              style={{ width: "100%", marginBottom: 0 }}
              {...register("poolFeeRatio")}
              placeholder={languageData.poolFeeRatioPlaceholder}
            />
            {errors.fundFocus && (
              <p className="text-center mt-1">{errors.fundFocus.message}</p>
            )}
          </Col>
        </Row>

        {/* VaultOwners */}
        <Row className="justify-content-center mt-3">
          <Col lg={3} xs={5}>
            <label>Vault Owners:</label>
          </Col>
          <Col
            lg={9}
            xs={7}
            className="justify-content-center d-flex flex-column"
          >
            <input
              style={{ width: "100%", marginBottom: 0 }}
              {...register("allowedVaultAddresInput")}
              placeholder={languageData.addAllowedTokenPlaceholder}
            />
            {errors.allowedVaultsArray && (
              <p className="text-center mt-2">
                {errors.allowedVaultsArray.message}
              </p>
            )}
          </Col>
        </Row>
        <Row className={`justify-content-center`} xs={1} md={2} lg={2} xl={2}>
          {allowedVaultAddresses.map((col, index) => {
            return (
              <Col
                key={index}
                className={"p-2 w-100 text-center"}
                style={{ cursor: "default" }}
              >
                <Badge
                  key={index}
                  className="bg-light text-dark p-2 fs-2"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => onClickRemoveAllowedVault(col)}
                >
                  {col}
                </Badge>
              </Col>
            );
          })}
        </Row>
        <Row className="justify-content-center mt-3">
          <Col
            className={`${styles.addButtonContainer} justify-content-end d-flex`}
          >
            <Button
              className={styles.addButton}
              style={{ backgroundColor: theme.primaryColor }}
              onClick={addToVaultOwners}
            >
              Add Address
            </Button>
          </Col>
        </Row>

        {/* Vault Threshold */}
        <Row className="justify-content-center mt-3">
          <Col lg={3} xs={5}>
            <label>Vault Threshold:</label>
          </Col>
          <Col
            lg={9}
            xs={7}
            className="justify-content-center d-flex flex-column"
          >
            <input
              style={{ width: "100%", marginBottom: 0 }}
              {...register("vaultThreshold")}
              placeholder="1"
            />
            {errors.fundFocus && (
              <p className="text-center mt-1">{errors.fundFocus.message}</p>
            )}
          </Col>
        </Row>

        {/* AllowedTokens */}
        <Row className="justify-content-center mt-3">
          <Col lg={3} xs={5}>
            <label>{languageData.addAllowedTokenLabel}</label>
          </Col>
          <Col
            lg={9}
            xs={7}
            className="justify-content-center d-flex flex-column"
          >
            <input
              style={{ width: "100%", marginBottom: 0 }}
              {...register("allowedTokenInput")}
              placeholder={languageData.addAllowedTokenPlaceholder}
            />
            {errors.allowedTokensArray && (
              <p className="text-center mt-2">
                {errors.allowedTokensArray.message}
              </p>
            )}
          </Col>
        </Row>
        <Row className={`justify-content-center`} xs={1} md={2} lg={2} xl={2}>
          {allowedTokenAddresses.map((col, index) => {
            return (
              <Col
                key={index}
                className={"p-2 w-100 text-center"}
                style={{ cursor: "default" }}
              >
                <Badge
                  key={index}
                  className="bg-light text-dark p-2 fs-2"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => onClickRemoveAllowedToken(col)}
                >
                  {col}
                </Badge>
              </Col>
            );
          })}
        </Row>
        <Row className="justify-content-center mt-3">
          <Col
            className={`${styles.addButtonContainer} justify-content-end d-flex`}
          >
            <Button
              className={styles.addButton}
              style={{ backgroundColor: theme.primaryColor }}
              onClick={addToAllowedTokens}
            >
              {languageData.addAllowedTokenButtonLabel}
            </Button>
          </Col>
        </Row>

        {/* <Row className="justify-content-center mt-3 d-block">
          <Col className={styles.requestableCheckbox}>
            <Form.Check
              type="switch"
              id="custom-switch"
              label={`Requestable`}
              onChange={requestableChange}
              disabled
            />
          </Col>
          <Col className={styles.requestableCheckbox}>
            <p className={styles.descText}>{languageData.requestDesc}</p>
          </Col>
        </Row> */}

        {!requestable ? null : (
          <Row className="justify-content-center mt-3">
            <Col lg={3} xs={3}>
              <label>{languageData.jobNameLabel}</label>
            </Col>
            <Col
              lg={3}
              xs={3}
              className="justify-content-center d-flex flex-column"
            >
              <input
                style={{ width: "100%", marginBottom: 0 }}
                {...register("jobName")}
                placeholder={languageData.jobNamePlaceholder}
              />
              {errors.jobName && (
                <p className="text-center mt-1">{errors.jobName.message}</p>
              )}
            </Col>
            <Col lg={3} xs={3}>
              <label style={{ textAlign: "center" }}>
                {languageData.jobIdLabel}
              </label>
            </Col>
            <Col
              lg={3}
              xs={3}
              className="justify-content-center d-flex flex-column"
            >
              <input
                style={{ width: "100%", marginBottom: 0 }}
                {...register("jobId")}
                placeholder={languageData.jobIdPlaceholder}
              />
              {errors.jobId && (
                <p className="text-center mt-1">{errors.jobId.message}</p>
              )}
            </Col>
            {jobs.map((col, index) => {
              return (
                <Col
                  lg={3}
                  key={index}
                  className={"p-2 w-100 text-center"}
                  style={{ cursor: "default" }}
                  //maybe all static col size ?
                >
                  <Badge
                    key={index}
                    className="bg-light text-dark p-2 fs-2"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => onClickRemoveJob(col)}
                  >
                    {col.id ? `${col.name}:${col.id}` : col.name}
                  </Badge>
                </Col>
              );
            })}
            <Col
              lg={12}
              className={`${styles.addButtonContainer} justify-content-end d-flex`}
            >
              <Button className={styles.addButton} onClick={addToJobs}>
                {languageData.addJobButtonLabel}
              </Button>
            </Col>
          </Row>
        )}
        <Row
          className={`justify-content-center`}
          xs={1}
          md={2}
          lg={2}
          xl={2}
        ></Row>
        <Row className="justify-content-center mt-3">
          <Col className={styles.createButtonContainer}>
            <Button
              isLoading={isLoading}
              className={styles.createButton}
              onClick={() => write?.()}
            >
              {languageData.createRequestButton}
            </Button>
          </Col>
        </Row>
      </form>
    </>
  );
};

export default FundCreateForm;
