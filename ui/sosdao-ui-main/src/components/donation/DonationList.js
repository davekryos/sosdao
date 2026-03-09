import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spinner } from "react-bootstrap";

import { fetchDonations } from "../../redux/actions";

import DonationRow from "./DonationRow";

const DonationList = ({ fundId }) => {
  const donations = useSelector((state) => state.data.donations[fundId] || []);
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.ui.donations.loading);

  useEffect(() => {
    dispatch(fetchDonations(fundId));
  }, [fundId, dispatch]);

  return isLoading ? (
    <div className="d-flex justify-content-center my-4">
      <Spinner animation="border" />
    </div>
  ) : (
    <>
      {donations.length ? (
        <div className="tw-divide-y tw-divide-solid tw-divide-black">
          {donations
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((donation) => (
              <DonationRow key={donation.txHash} {...donation} />
            ))}
        </div>
      ) : (
        <div className="p-4">No donations yet.</div>
      )}
    </>
  );
};

export default DonationList;
