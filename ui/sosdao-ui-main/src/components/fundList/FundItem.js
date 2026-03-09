import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";

const FundItem = ({ fundId }) => {
  const fund = useSelector((state) => state.data.funds[fundId]);

  return (
    <NavLink to={`funds/${fund.id}`} className="hover:tw-text-gray-600">
      <div className="bg-brand-light  tw-rounded tw-my-2 tw-p-4" key={fund.id}>
        <div className="tw-text-xl">{fund.name}</div>
        <div className="tw-italic tw-text-sm">{fund.description}</div>
      </div>
    </NavLink>
  );
};

export default FundItem;
