import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { Col, Container, Row, Spinner } from "react-bootstrap";
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
import Decimal from "decimal.js";
import Map from "./Map";
import Button from "../custom/Button";
import styles from "./styles.module.scss";

const CreateRequest = (props) => {
  const dispatch = useDispatch();
  const history = useHistory();

  const data = useSelector((state) => state.language.createRequest);
  const fund = useSelector(
    (state) => state.data.funds[props.match.params.fundId],
  );
  const tokens = useSelector((state) => state.data.tokens);
  const contracts = useSelector((state) => state.contracts);
  const formData = useSelector((state) => state.data.forms.CREATE_REQUEST);
  const currentAccount = useSelector((state) => state.account.account);
  const inTX = useSelector((state) => state.ui.transaction);

  const coordinates = formData?.coordinates;

  const schema = Yup.object().shape({
    requestAmount: Yup.number()
      .required("Please enter a request amount")
      .typeError("Amount must be a number")
      .positive("Please enter a positive number"),
    recipient: Yup.string()
      .required("Please enter an address")
      .default(currentAccount),
    allowedToken: Yup.string().required("Please select a token"),
    description: Yup.string().required("Please enter a request description"),
  });

  const {
    formState: { errors },
    handleSubmit,
    getFieldState,
    register,
    setValue,
  } = useForm({
    defaultValues: schema.cast(),
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (!contracts.Governor?.address) dispatch(fetchContract("GOVERNOR"));
  }, [contracts, dispatch]);

  useEffect(() => {
    const center = { lat: 41.00613642667943, lng: 29.085037708282474 };
    dispatch(setFormData("CREATE_REQUEST", "coordinates", center));
  }, []);

  useEffect(() => {
    if (currentAccount && !getFieldState("recipient").isTouched) {
      setValue("recipient", currentAccount);
    }
  }, [currentAccount, getFieldState, setValue]);

  const onSubmit = async (data) => {
    try {
      dispatch(enterTX("CreateRequest"));
      const _amount = ethers.utils.parseUnits(
        data.requestAmount.toString(),
        tokens[data.allowedToken].decimals,
      );

      await contracts.Governor?.createRequest(
        _amount,
        data.allowedToken,
        data.recipient,
        props.match.params.fundId,
        [
          ethers.utils.parseUnits(
            new Decimal(coordinates?.lat)
              .toDecimalPlaces(10, Decimal.ROUND_DOWN)
              .toString(),
            10,
          ),
          ethers.utils.parseUnits(
            new Decimal(coordinates?.lng)
              .toDecimalPlaces(10, Decimal.ROUND_DOWN)
              .toString(),
            10,
          ),
        ],
        data.description,
      );

      const filter = contracts.Governor.filters.RequestCreated(
        null,
        fund.id,
        data.recipient,
      );

      contracts.Governor.once(filter, () => {
        history.push(`/funds/${fund.id}`);
        dispatch(notify("success", "Success", "Your request is created"));
        dispatch(exitTX());
        dispatch(fetchRequests(fund.id));
      });
    } catch (error) {
      dispatch(notify("error", "Error", error.message));
      dispatch(exitTX());
    }
  };

  return fund ? (
    <Container className="my-4">
      <div className="card mb-5 mx-1 mx-md-1 mx-lg-5 p-3 p-md-4">
        <form className={styles.requestForm} onSubmit={handleSubmit(onSubmit)}>
          <Row className="justify-content-center">
            <Col xs={7} lg={4}>
              <label>{data.requestAmount}</label>
              <input
                {...register("requestAmount")}
                placeholder={data.requestAmountPlaceholder}
              />
              {errors.requestAmount && <p>{errors.requestAmount.message}</p>}
            </Col>
            <Col xs={5} lg={2}>
              <label>{data.allowedTokens}</label>
              <select
                {...register("allowedToken")}
                className="browser-default custom-select"
              >
                {fund.allowedTokens.map((address, index) => {
                  return (
                    <option key={index} value={address}>
                      {tokens[address].symbol}
                    </option>
                  );
                })}
              </select>
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col lg={6}>
              <label>{data.recipient}</label>
              <input {...register("recipient")} />
              {errors.recipient && <p>{errors.recipient.message}</p>}
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col lg={6}>
              <label>{data.description}</label>
              <textarea
                {...register("description")}
                type="textarea"
                rows={3}
                placeholder={data.descriptionPlaceholder}
              />
              {errors.description && <p>{errors.description.message}</p>}
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col xs={6} lg={3}>
              <label>{data.latitude}</label>
              <div key={coordinates?.lat}>
                <input readOnly defaultValue={coordinates?.lat} />
              </div>
              {errors.latitude && <p>{errors.latitude.message}</p>}
            </Col>
            <Col xs={6} lg={3}>
              <label>{data.longitude}</label>
              <div key={coordinates?.lng}>
                <input readOnly defaultValue={coordinates?.lng} />
              </div>
              {errors.longitude && <p>{errors.longitude.message}</p>}
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col xs={12} lg={6}>
              <Map
                coordinates={coordinates}
                setCoordinates={(coordinates) => {
                  dispatch(
                    setFormData("CREATE_REQUEST", "coordinates", coordinates),
                  );
                }}
              />
            </Col>
          </Row>
          <Row className={styles.createButtonContainer}>
            <Col>
              <Button
                isLoading={inTX.type === "CreateRequest" && inTX.pending}
                disabled={inTX.type === "CreateRequest" && inTX.pending}
                type="submit"
                className={styles.createButton}
                onSubmit={handleSubmit(onSubmit)}
              >
                {data.createRequestButton}
              </Button>
            </Col>
          </Row>
        </form>
      </div>
    </Container>
  ) : (
    <Container className="spinnerContainer">
      <Spinner animation="border" />
    </Container>
  );
};

export default CreateRequest;
